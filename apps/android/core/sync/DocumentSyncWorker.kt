package com.neurafin.hub.core.sync

import android.content.Context
import android.util.Log
import androidx.work.*
import com.neurafin.hub.core.data.local.NeurafinDatabase
import com.neurafin.hub.core.data.local.SyncQueueEntity
import com.neurafin.hub.core.network.ApiResult
import com.neurafin.hub.core.network.NeurafinApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID

private const val TAG = "NeurafinSyncWorker"

// ============================================================
// Worker de Sincronização (fora da UI thread, gerenciado pelo OS)
// ============================================================

class DocumentSyncWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    companion object {
        const val KEY_USER_TOKEN = "user_token"

        /**
         * Agenda uma sincronização única com constraint de rede.
         * Idempotente: usa a tag SYNC_TAG para evitar enfileiramento duplicado.
         */
        const val SYNC_TAG = "neurafin_document_sync"

        fun scheduleOnce(context: Context, userToken: String) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<DocumentSyncWorker>()
                .setConstraints(constraints)
                .setInputData(workDataOf(KEY_USER_TOKEN to userToken))
                .addTag(SYNC_TAG)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, java.util.concurrent.TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context)
                .enqueueUniqueWork(SYNC_TAG, ExistingWorkPolicy.KEEP, request)
        }

        fun schedulePeriodicIfNotScheduled(context: Context, userToken: String) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<DocumentSyncWorker>(
                repeatInterval = 15,
                repeatIntervalTimeUnit = java.util.concurrent.TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setInputData(workDataOf(KEY_USER_TOKEN to userToken))
                .addTag(SYNC_TAG)
                .build()

            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    SYNC_TAG,
                    ExistingPeriodicWorkPolicy.KEEP,
                    request
                )
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val userToken = inputData.getString(KEY_USER_TOKEN)
        if (userToken.isNullOrBlank()) {
            Log.e(TAG, "Token de usuário ausente. Abortando sincronização.")
            return@withContext Result.failure()
        }

        val db = NeurafinDatabase.getInstance(applicationContext)
        val syncQueueDao = db.syncQueueDao()
        val client = NeurafinApiClient()

        val pending = syncQueueDao.getPendingItems()
        Log.i(TAG, "Iniciando ciclo de sincronização com ${pending.size} item(s) pendente(s).")

        if (pending.isEmpty()) {
            Log.i(TAG, "Fila vazia — tentando sincronização de processamento de jobs.")
            when (val jobsResult = client.processJobs(userToken)) {
                is ApiResult.Success -> {
                    Log.i(TAG, "Ciclo do worker: ${jobsResult.data.processed_jobs} job(s) processado(s).")
                }
                is ApiResult.HttpError -> Log.w(TAG, "HTTP ${jobsResult.code} ao processar jobs: ${jobsResult.body}")
                is ApiResult.NetworkError -> Log.w(TAG, "Rede indisponível ao processar jobs: ${jobsResult.message}")
            }
            return@withContext Result.success()
        }

        var anyFailure = false
        for (item in pending) {
            try {
                val success = processSyncItem(client, db, syncQueueDao, item, userToken)
                if (!success) anyFailure = true
            } catch (e: Exception) {
                Log.e(TAG, "Falha inesperada ao processar item ${item.id}: ${e.message}")
                syncQueueDao.markFailed(item.id, e.message ?: "Exceção inesperada")
                anyFailure = true
            }
        }

        syncQueueDao.clearSynced()

        if (anyFailure && runAttemptCount < 3) {
            Log.w(TAG, "Algumas sincronizações falharam. Agendando nova tentativa.")
            Result.retry()
        } else {
            Result.success()
        }
    }

    private suspend fun processSyncItem(
        client: NeurafinApiClient,
        db: NeurafinDatabase,
        syncQueueDao: com.neurafin.hub.core.data.local.SyncQueueDao,
        item: SyncQueueEntity,
        userToken: String
    ): Boolean {
        return when (item.action) {
            "update_sector" -> {
                // Payload esperado: {"documentId":"...","sectorId":"..."}
                val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
                val payload = json.decodeFromString<Map<String, String>>(item.payload)
                val docId = payload["documentId"] ?: return false
                val secId = payload["sectorId"] ?: return false

                when (val result = client.updateDocumentSector(userToken, docId, secId)) {
                    is ApiResult.Success -> {
                        Log.i(TAG, "Setor do documento $docId atualizado remotamente.")
                        db.documentDao().updateSector(
                            documentId = docId,
                            userId = result.data.user_id,
                            sectorId = secId,
                            now = System.currentTimeMillis()
                        )
                        syncQueueDao.markSynced(item.id)
                        true
                    }
                    is ApiResult.HttpError -> {
                        Log.w(TAG, "HTTP ${result.code} ao atualizar setor: ${result.body}")
                        syncQueueDao.markFailed(item.id, "HTTP ${result.code}: ${result.body}")
                        false
                    }
                    is ApiResult.NetworkError -> {
                        Log.w(TAG, "Rede indisponível: ${result.message}")
                        syncQueueDao.markFailed(item.id, result.message)
                        false
                    }
                }
            }

            else -> {
                Log.e(TAG, "Ação de sincronização desconhecida: ${item.action}")
                syncQueueDao.markFailed(item.id, "Ação '${item.action}' não reconhecida pelo worker.")
                false
            }
        }
    }
}

// ============================================================
// Repositório de Fila com Idempotência
// ============================================================

class SyncQueueRepository(private val db: NeurafinDatabase) {
    private val syncQueueDao = db.syncQueueDao()

    /**
     * Enfileira a atualização de setor de um documento.
     * Idempotente: substitui se já existir um item com a mesma action + documentId.
     */
    suspend fun enqueueUpdateSector(documentId: String, sectorId: String) {
        val payload = """{"documentId":"$documentId","sectorId":"$sectorId"}"""
        val item = SyncQueueEntity(
            id = UUID.randomUUID().toString(),
            action = "update_sector",
            payload = payload,
            createdAt = System.currentTimeMillis(),
            status = "pending",
            errorMessage = null,
            attempts = 0
        )
        syncQueueDao.enqueue(item)
    }

    fun getPendingCountFlow() = syncQueueDao.getPendingCountFlow()
}

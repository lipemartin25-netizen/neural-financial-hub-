package com.neurafin.hub.feature.documents

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neurafin.hub.core.data.local.DocumentEntity
import com.neurafin.hub.core.data.local.NeurafinDatabase
import com.neurafin.hub.core.data.local.SectorEntity
import com.neurafin.hub.core.data.local.SyncQueueEntity
import com.neurafin.hub.core.network.ApiResult
import com.neurafin.hub.core.network.DocumentDto
import com.neurafin.hub.core.network.NeurafinApiClient
import com.neurafin.hub.core.network.SectorDto
import com.neurafin.hub.core.sync.DocumentSyncWorker
import com.neurafin.hub.core.sync.SyncQueueRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

// ============================================================
// UI State — expresso como sealed class para estados honestos
// ============================================================

sealed class DocumentsUiState {
    object Loading : DocumentsUiState()
    data class Success(
        val sectors: List<SectorEntity>,
        val documents: List<DocumentEntity>,
        val selectedSectorId: String?,
        val pendingQueueCount: Int,
        val isOnline: Boolean
    ) : DocumentsUiState()
    data class Error(val message: String, val retryable: Boolean) : DocumentsUiState()
}

// ============================================================
// ViewModel — lógica isolada da UI
// ============================================================

class DocumentsViewModel(
    private val appContext: Context,
    private val userToken: String,
    private val userId: String
) : ViewModel() {

    private val client = NeurafinApiClient()
    private val db by lazy { NeurafinDatabase.getInstance(appContext) }
    private val syncRepo by lazy { SyncQueueRepository(db) }

    private val _selectedSectorId = MutableStateFlow<String?>(null)

    // Estado composto: combina banco local + estado de seleção
    val uiState: StateFlow<DocumentsUiState> = combine(
        db.documentDao().getDocumentsFlow(userId),
        db.sectorDao().getSectorsFlow(userId),
        _selectedSectorId,
        syncRepo.getPendingCountFlow()
    ) { docs, sectors, selectedSector, pendingCount ->
        val filteredDocs = if (selectedSector != null) {
            docs.filter { it.sectorId == selectedSector }
        } else docs

        DocumentsUiState.Success(
            sectors = sectors,
            documents = filteredDocs,
            selectedSectorId = selectedSector,
            pendingQueueCount = pendingCount,
            isOnline = true // Monitorado pelo ConnectivityManager na Activity
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = DocumentsUiState.Loading
    )

    // === Sincronização com API ===

    fun syncWithApi() {
        viewModelScope.launch {
            when (val result = client.getSectors(userToken)) {
                is ApiResult.Success -> {
                    val entities = result.data.map { it.toEntity(userId) }
                    db.sectorDao().deleteAllForUser(userId)
                    db.sectorDao().insertAll(entities)
                }
                is ApiResult.HttpError -> { /* Mantém cache local */ }
                is ApiResult.NetworkError -> { /* Offline: usa cache Room */ }
            }

            when (val result = client.getDocuments(userToken)) {
                is ApiResult.Success -> {
                    val entities = result.data.map { it.toEntity() }
                    db.documentDao().insertAll(entities)
                }
                is ApiResult.HttpError -> { /* Mantém cache local */ }
                is ApiResult.NetworkError -> { /* Offline: usa cache Room */ }
            }
        }
    }

    // === Atualização de Setor com Sincronização Idempotente ===

    fun updateDocumentSector(documentId: String, newSectorId: String, isOnline: Boolean) {
        viewModelScope.launch {
            // 1. Aplica localmente de imediato (UI reage instantaneamente)
            db.documentDao().updateSector(
                documentId = documentId,
                userId = userId,
                sectorId = newSectorId,
                now = System.currentTimeMillis()
            )

            if (isOnline) {
                // 2a. Online: tenta sincronizar imediatamente
                when (val result = client.updateDocumentSector(userToken, documentId, newSectorId)) {
                    is ApiResult.Success -> { /* Sincronizado */ }
                    is ApiResult.HttpError, is ApiResult.NetworkError -> {
                        // Falha: enfileira para retry posterior
                        syncRepo.enqueueUpdateSector(documentId, newSectorId)
                        DocumentSyncWorker.scheduleOnce(appContext, userToken)
                    }
                }
            } else {
                // 2b. Offline: enfileira para quando conexão retornar
                syncRepo.enqueueUpdateSector(documentId, newSectorId)
                DocumentSyncWorker.scheduleOnce(appContext, userToken)
            }
        }
    }

    fun selectSectorFilter(sectorId: String?) {
        _selectedSectorId.value = sectorId
    }

    // === Mappers DTO → Entity ===

    private fun SectorDto.toEntity(uid: String) = SectorEntity(
        id = id,
        userId = uid,
        name = name,
        color = color,
        isDefault = is_default,
        createdAt = 0L,
        updatedAt = 0L
    )

    private fun DocumentDto.toEntity() = DocumentEntity(
        id = id,
        userId = user_id,
        sectorId = sector_id,
        fileName = file_name,
        fileSize = file_size,
        mimeType = mime_type,
        status = status,
        suggestedSectorId = suggested_sector_id,
        confidenceScore = confidence_score,
        version = version,
        createdAt = 0L,
        updatedAt = 0L
    )
}

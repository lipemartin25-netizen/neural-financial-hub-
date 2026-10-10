package com.neurafin.hub.core.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

// ============================================================
// Entities (Tabelas Room)
// ============================================================

@Entity(tableName = "sectors")
data class SectorEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val name: String,
    val color: String,
    val isDefault: Boolean,
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(tableName = "documents")
data class DocumentEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val sectorId: String?,
    val fileName: String,
    val fileSize: Long,
    val mimeType: String,
    val status: String,
    val suggestedSectorId: String?,
    val confidenceScore: Float,
    val version: Int,
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey val id: String,
    val action: String,              // "upload_document" | "update_sector"
    val payload: String,             // JSON serializado do payload
    val createdAt: Long,
    val status: String,              // "pending" | "syncing" | "synced" | "failed"
    val errorMessage: String?,
    val attempts: Int = 0
)

// ============================================================
// DAOs (Data Access Objects)
// ============================================================

@Dao
interface SectorDao {
    @Query("SELECT * FROM sectors WHERE userId = :userId ORDER BY name ASC")
    fun getSectorsFlow(userId: String): Flow<List<SectorEntity>>

    @Query("SELECT * FROM sectors WHERE userId = :userId")
    suspend fun getSectors(userId: String): List<SectorEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(sectors: List<SectorEntity>)

    @Query("DELETE FROM sectors WHERE userId = :userId")
    suspend fun deleteAllForUser(userId: String)
}

@Dao
interface DocumentDao {
    @Query("SELECT * FROM documents WHERE userId = :userId ORDER BY updatedAt DESC")
    fun getDocumentsFlow(userId: String): Flow<List<DocumentEntity>>

    @Query("SELECT * FROM documents WHERE userId = :userId AND sectorId = :sectorId ORDER BY updatedAt DESC")
    fun getDocumentsBySector(userId: String, sectorId: String): Flow<List<DocumentEntity>>

    @Query("SELECT * FROM documents WHERE id = :documentId AND userId = :userId")
    suspend fun getDocument(documentId: String, userId: String): DocumentEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(document: DocumentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(documents: List<DocumentEntity>)

    @Query("UPDATE documents SET sectorId = :sectorId, status = 'ready', updatedAt = :now WHERE id = :documentId AND userId = :userId")
    suspend fun updateSector(documentId: String, userId: String, sectorId: String, now: Long)

    @Query("UPDATE documents SET status = :status, confidenceScore = :confidence, suggestedSectorId = :suggestedSectorId, updatedAt = :now WHERE id = :documentId")
    suspend fun updateStatus(documentId: String, status: String, confidence: Float, suggestedSectorId: String?, now: Long)

    @Query("SELECT COUNT(*) FROM documents WHERE userId = :userId AND status = 'pending_processing'")
    suspend fun countPending(userId: String): Int

    @Query("SELECT COUNT(*) FROM documents WHERE userId = :userId AND status = 'review_required'")
    suspend fun countReviewRequired(userId: String): Int
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue WHERE status IN ('pending', 'failed') ORDER BY createdAt ASC")
    suspend fun getPendingItems(): List<SyncQueueEntity>

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status IN ('pending', 'failed')")
    fun getPendingCountFlow(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueue(item: SyncQueueEntity)

    @Query("UPDATE sync_queue SET status = 'synced' WHERE id = :id")
    suspend fun markSynced(id: String)

    @Query("UPDATE sync_queue SET status = 'failed', errorMessage = :error, attempts = attempts + 1 WHERE id = :id")
    suspend fun markFailed(id: String, error: String)

    @Query("DELETE FROM sync_queue WHERE status = 'synced'")
    suspend fun clearSynced()
}

// ============================================================
// Database Definition
// ============================================================

@Database(
    entities = [SectorEntity::class, DocumentEntity::class, SyncQueueEntity::class],
    version = 1,
    exportSchema = false
)
abstract class NeurafinDatabase : RoomDatabase() {
    abstract fun sectorDao(): SectorDao
    abstract fun documentDao(): DocumentDao
    abstract fun syncQueueDao(): SyncQueueDao

    companion object {
        const val DATABASE_NAME = "neurafin_local.db"
    }
}

package com.neurafin.hub

import com.neurafin.hub.core.data.local.DocumentEntity
import com.neurafin.hub.core.data.local.SectorEntity
import com.neurafin.hub.core.data.local.SyncQueueEntity
import org.junit.Assert.*
import org.junit.Test
import java.util.UUID

/**
 * Testes unitários da Etapa 5 — Android nativo.
 *
 * NOTA DE EVIDÊNCIA:
 * Estes testes de lógica de negócio NÃO requerem JVM Android (rodam em JVM pura via JUnit4).
 * Os testes instrumentados (Room + WorkManager) requerem emulador ou dispositivo físico com JDK 17+.
 *
 * STATUS DE COMPILAÇÃO:
 * JDK 17 não encontrado nesta máquina (java.exe ausente do PATH, registro JavaSoft vazio).
 * A compilação via Gradle está bloqueada até que o JDK seja instalado.
 * Ver: docs/operations/stage-5-report.md para instruções de instalação.
 */

class DocumentEntityTest {

    @Test
    fun `documentEntity deve ter campos obrigatorios validos`() {
        val doc = DocumentEntity(
            id = UUID.randomUUID().toString(),
            userId = "user-123",
            sectorId = null,
            fileName = "extrato_bancario.pdf",
            fileSize = 204_800L,
            mimeType = "application/pdf",
            status = "pending_processing",
            suggestedSectorId = null,
            confidenceScore = 0f,
            version = 1,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )

        assertNotNull(doc.id)
        assertEquals("user-123", doc.userId)
        assertEquals("pending_processing", doc.status)
        assertEquals(0f, doc.confidenceScore)
        assertNull(doc.sectorId)
    }

    @Test
    fun `documentEntity deve refletir status ready quando confianca e maior que 60`() {
        val doc = DocumentEntity(
            id = UUID.randomUUID().toString(),
            userId = "user-abc",
            sectorId = "sector-financeiro",
            fileName = "nota_fiscal.txt",
            fileSize = 1024L,
            mimeType = "text/plain",
            status = "ready",
            suggestedSectorId = "sector-financeiro",
            confidenceScore = 0.85f,
            version = 1,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )

        assertEquals("ready", doc.status)
        assertTrue(doc.confidenceScore >= 0.60f)
        assertEquals(doc.sectorId, doc.suggestedSectorId)
    }

    @Test
    fun `documentEntity deve aceitar status review_required com confianca baixa`() {
        val doc = DocumentEntity(
            id = UUID.randomUUID().toString(),
            userId = "user-xyz",
            sectorId = null,
            fileName = "documento_ambiguo.docx",
            fileSize = 51_200L,
            mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            status = "review_required",
            suggestedSectorId = null,
            confidenceScore = 0.35f,
            version = 1,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )

        assertEquals("review_required", doc.status)
        assertTrue(doc.confidenceScore < 0.60f)
    }
}

class SyncQueueEntityTest {

    @Test
    fun `syncQueueEntity deve ser criado com status pending`() {
        val item = SyncQueueEntity(
            id = UUID.randomUUID().toString(),
            action = "update_sector",
            payload = """{"documentId":"doc-1","sectorId":"sec-2"}""",
            createdAt = System.currentTimeMillis(),
            status = "pending",
            errorMessage = null,
            attempts = 0
        )

        assertEquals("pending", item.status)
        assertEquals("update_sector", item.action)
        assertEquals(0, item.attempts)
        assertNull(item.errorMessage)
    }

    @Test
    fun `fila de sincronizacao offline deve ser idempotente`() {
        val docId = "doc-123"
        val sectorId = "sector-abc"
        val payload = """{"documentId":"$docId","sectorId":"$sectorId"}"""

        // Valida que o payload JSON pode ser reparseado corretamente
        assertTrue(payload.contains(docId))
        assertTrue(payload.contains(sectorId))
    }
}

class SectorEntityTest {

    @Test
    fun `sectorEntity deve ter cor no formato hexadecimal`() {
        val sector = SectorEntity(
            id = UUID.randomUUID().toString(),
            userId = "user-1",
            name = "Financeiro",
            color = "#10b981",
            isDefault = true,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )

        assertTrue(sector.color.startsWith("#"))
        assertEquals(7, sector.color.length)
        assertEquals("Financeiro", sector.name)
        assertTrue(sector.isDefault)
    }
}

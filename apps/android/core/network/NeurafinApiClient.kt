package com.neurafin.hub.core.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

// ============================================================
// Modelos de Resposta da API (espelham o OpenAPI compartilhado)
// ============================================================

@Serializable
data class TokenResponse(
    val access_token: String,
    val token_type: String,
    val user_id: String,
    val email: String
)

@Serializable
data class SectorDto(
    val id: String,
    val user_id: String,
    val name: String,
    val color: String,
    val is_default: Boolean,
    val created_at: String,
    val updated_at: String
)

@Serializable
data class DocumentDto(
    val id: String,
    val user_id: String,
    val sector_id: String? = null,
    val file_name: String,
    val file_size: Long,
    val mime_type: String,
    val status: String,
    val suggested_sector_id: String? = null,
    val confidence_score: Float = 0f,
    val version: Int,
    val created_at: String,
    val updated_at: String
)

@Serializable
data class ProcessJobsResponse(
    val status: String,
    val processed_jobs: Int,
    val message: String
)

// ============================================================
// Resultado Selado para Tratamento Honesto de Erros
// ============================================================

sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class HttpError(val code: Int, val body: String) : ApiResult<Nothing>()
    data class NetworkError(val message: String) : ApiResult<Nothing>()
}

// ============================================================
// Cliente HTTP Nativo — sem OkHttp para menor footprint
// ============================================================

class NeurafinApiClient(
    private val baseUrl: String = "http://10.0.2.2:8000/api/v1"
) {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    // === Autenticação ===

    suspend fun requestToken(email: String): ApiResult<TokenResponse> = withContext(Dispatchers.IO) {
        request(
            method = "POST",
            path = "/auth/token",
            body = """{"email":"$email"}""",
            token = null,
            responseType = TokenResponse.serializer()
        )
    }

    // === Setores ===

    suspend fun getSectors(token: String): ApiResult<List<SectorDto>> = withContext(Dispatchers.IO) {
        request(
            method = "GET",
            path = "/documents/sectors",
            body = null,
            token = token,
            responseType = kotlinx.serialization.builtins.ListSerializer(SectorDto.serializer())
        )
    }

    // === Documentos ===

    suspend fun getDocuments(token: String, sectorId: String? = null): ApiResult<List<DocumentDto>> = withContext(Dispatchers.IO) {
        val qs = if (sectorId != null) "?sector_id=$sectorId" else ""
        request(
            method = "GET",
            path = "/documents$qs",
            body = null,
            token = token,
            responseType = kotlinx.serialization.builtins.ListSerializer(DocumentDto.serializer())
        )
    }

    suspend fun updateDocumentSector(token: String, documentId: String, sectorId: String): ApiResult<DocumentDto> = withContext(Dispatchers.IO) {
        request(
            method = "PATCH",
            path = "/documents/$documentId/sector",
            body = """{"sector_id":"$sectorId"}""",
            token = token,
            responseType = DocumentDto.serializer()
        )
    }

    suspend fun processJobs(token: String): ApiResult<ProcessJobsResponse> = withContext(Dispatchers.IO) {
        request(
            method = "POST",
            path = "/documents/process-jobs",
            body = null,
            token = token,
            responseType = ProcessJobsResponse.serializer()
        )
    }

    // === Infra HTTP interna ===

    private fun <T> request(
        method: String,
        path: String,
        body: String?,
        token: String?,
        responseType: kotlinx.serialization.DeserializationStrategy<T>
    ): ApiResult<T> {
        val url = URL("$baseUrl$path")
        val connection = url.openConnection() as HttpURLConnection
        return try {
            connection.requestMethod = method
            connection.connectTimeout = 10_000
            connection.readTimeout = 15_000
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            connection.setRequestProperty("Accept", "application/json")
            if (token != null) {
                connection.setRequestProperty("Authorization", "Bearer $token")
            }

            if (body != null) {
                connection.doOutput = true
                connection.outputStream.use { os ->
                    os.write(body.toByteArray(Charsets.UTF_8))
                }
            }

            val code = connection.responseCode
            val responseBody = if (code in 200..299) {
                connection.inputStream.bufferedReader().readText()
            } else {
                connection.errorStream?.bufferedReader()?.readText() ?: ""
            }

            if (code in 200..299) {
                val parsed = json.decodeFromString(responseType, responseBody)
                ApiResult.Success(parsed)
            } else {
                ApiResult.HttpError(code, responseBody)
            }
        } catch (e: IOException) {
            ApiResult.NetworkError(e.message ?: "Falha de rede desconhecida")
        } finally {
            connection.disconnect()
        }
    }
}

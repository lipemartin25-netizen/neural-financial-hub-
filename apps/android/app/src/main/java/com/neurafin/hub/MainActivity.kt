package com.neurafin.hub

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.lifecycleScope
import com.neurafin.hub.core.data.local.NeurafinDatabase
import com.neurafin.hub.core.network.ApiResult
import com.neurafin.hub.core.network.NeurafinApiClient
import com.neurafin.hub.core.sync.DocumentSyncWorker
import com.neurafin.hub.feature.documents.DocumentsScreen
import com.neurafin.hub.feature.documents.DocumentsUiState
import com.neurafin.hub.feature.documents.DocumentsViewModel
import kotlinx.coroutines.launch

/**
 * Activity raiz do Neurafin Hub Android.
 *
 * Responsabilidades:
 * 1. Autenticar com a API e obter token JWT.
 * 2. Monitorar conectividade de rede.
 * 3. Inicializar ViewModel e agendar sincronização periódica (WorkManager).
 * 4. Compor a tela de documentos.
 */
class MainActivity : ComponentActivity() {

    private val client = NeurafinApiClient()
    private var viewModel: DocumentsViewModel? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Estado de conectividade compartilhado com a UI
        var isOnline = isNetworkAvailable()

        // Monitora mudanças de rede e agenda sincronização ao reconectar
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                isOnline = true
                viewModel?.syncWithApi()
            }
            override fun onLost(network: Network) {
                isOnline = false
            }
        }
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, networkCallback)

        // Autenticação e inicialização da UI
        lifecycleScope.launch {
            val email = "usuario.a@neurafin.com"
            when (val result = client.requestToken(email)) {
                is ApiResult.Success -> {
                    val tokenData = result.data
                    val vm = DocumentsViewModel(
                        appContext = applicationContext,
                        userToken = tokenData.access_token,
                        userId = tokenData.user_id
                    )
                    viewModel = vm
                    vm.syncWithApi()

                    // Agenda sincronização periódica via WorkManager (15 min mínimo)
                    DocumentSyncWorker.schedulePeriodicIfNotScheduled(this@MainActivity, tokenData.access_token)

                    setContent {
                        val uiState by vm.uiState.collectAsState()
                        NeurafinTheme {
                            DocumentsScreen(
                                uiState = if (uiState is DocumentsUiState.Success)
                                    (uiState as DocumentsUiState.Success).copy(isOnline = isOnline)
                                else uiState,
                                onSectorFilterSelected = vm::selectSectorFilter,
                                onUpdateDocumentSector = { docId, sectorId ->
                                    vm.updateDocumentSector(docId, sectorId, isOnline)
                                },
                                onSyncNow = vm::syncWithApi,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }
                is ApiResult.HttpError -> {
                    setContent {
                        NeurafinTheme {
                            DocumentsScreen(
                                uiState = DocumentsUiState.Error(
                                    "Falha de autenticação com a API (HTTP ${result.code}). Verifique se o servidor backend está em execução no endereço configurado.",
                                    retryable = false
                                ),
                                onSectorFilterSelected = {},
                                onUpdateDocumentSector = { _, _ -> },
                                onSyncNow = {},
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }
                is ApiResult.NetworkError -> {
                    setContent {
                        NeurafinTheme {
                            DocumentsScreen(
                                uiState = DocumentsUiState.Error(
                                    "Sem conectividade de rede. Os dados locais offline são exibidos em modo somente leitura.",
                                    retryable = true
                                ),
                                onSectorFilterSelected = {},
                                onUpdateDocumentSector = { _, _ -> },
                                onSyncNow = { recreate() },
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }
            }
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val cap = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return cap.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}

// ============================================================
// Tema — espelha os design tokens do packages/design-tokens
// ============================================================

@Composable
private fun NeurafinTheme(content: @Composable () -> Unit) {
    val colorScheme = darkColorScheme(
        primary = Color(0xFFc9a858),
        onPrimary = Color.Black,
        secondary = Color(0xFF10b981),
        onSecondary = Color.Black,
        background = Color(0xFF0b0d10),
        surface = Color(0xFF12151a),
        onBackground = Color(0xFFf8fafc),
        onSurface = Color(0xFFf8fafc)
    )

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}

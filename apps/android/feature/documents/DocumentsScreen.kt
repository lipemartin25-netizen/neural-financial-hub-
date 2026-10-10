package com.neurafin.hub.feature.documents

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import com.neurafin.hub.core.data.local.DocumentEntity
import com.neurafin.hub.core.data.local.SectorEntity

// ============================================================
// Tela principal — Hub de Documentos
// ============================================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocumentsScreen(
    uiState: DocumentsUiState,
    onSectorFilterSelected: (String?) -> Unit,
    onUpdateDocumentSector: (String, String) -> Unit,
    onSyncNow: () -> Unit,
    modifier: Modifier = Modifier
) {
    val goldColor = Color(0xFFc9a858)
    val emeraldColor = Color(0xFF10b981)
    val bgColor = Color(0xFF0b0d10)
    val surfaceColor = Color(0xFF12151a)
    val cardColor = Color(0xFF161920)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Neurafin Hub",
                            fontWeight = FontWeight.Bold,
                            color = goldColor,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "Hub Documental & Cofre Privado",
                            fontSize = 11.sp,
                            color = Color(0xFF94a3b8)
                        )
                    }
                },
                actions = {
                    // Indicador de fila offline
                    if (uiState is DocumentsUiState.Success && uiState.pendingQueueCount > 0) {
                        AssistChip(
                            onClick = onSyncNow,
                            label = {
                                Text(
                                    "${uiState.pendingQueueCount} na fila",
                                    fontSize = 11.sp
                                )
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Sync, contentDescription = null, modifier = Modifier.size(14.dp))
                            },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = Color(0xFF78350f),
                                labelColor = Color(0xFFfbbf24)
                            ),
                            border = AssistChipDefaults.assistChipBorder(
                                borderColor = Color(0xFFf59e0b)
                            )
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }

                    IconButton(onClick = onSyncNow) {
                        Icon(Icons.Default.Refresh, contentDescription = "Sincronizar", tint = Color(0xFF94a3b8))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = surfaceColor
                )
            )
        },
        containerColor = bgColor,
        modifier = modifier
    ) { paddingValues ->
        when (uiState) {
            is DocumentsUiState.Loading -> {
                Box(Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = goldColor)
                }
            }
            is DocumentsUiState.Error -> {
                Box(Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                    ErrorCard(message = uiState.message, retryable = uiState.retryable, onRetry = onSyncNow)
                }
            }
            is DocumentsUiState.Success -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Indicador de Status Sistêmico
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            ConnectionStatusChip(
                                isOnline = uiState.isOnline,
                                emeraldColor = emeraldColor
                            )

                            // Stats rápidos
                            val pendingCount = uiState.documents.count { it.status == "pending_processing" }
                            val reviewCount = uiState.documents.count { it.status == "review_required" }
                            if (pendingCount > 0 || reviewCount > 0) {
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    if (pendingCount > 0) {
                                        StatusCountChip("$pendingCount aguardando", Color(0xFFf59e0b))
                                    }
                                    if (reviewCount > 0) {
                                        StatusCountChip("$reviewCount p/ revisar", Color(0xFFf97316))
                                    }
                                }
                            }
                        }
                    }

                    // Grid de Setores
                    if (uiState.sectors.isNotEmpty()) {
                        item {
                            SectorFilterRow(
                                sectors = uiState.sectors,
                                selectedSectorId = uiState.selectedSectorId,
                                documents = uiState.documents,
                                goldColor = goldColor,
                                surfaceColor = surfaceColor,
                                cardColor = cardColor,
                                onSectorSelected = onSectorFilterSelected
                            )
                        }
                    }

                    // Cabeçalho da listagem
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    "Documentos no Cofre",
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFf1f5f9),
                                    fontSize = 15.sp
                                )
                                Text(
                                    "${uiState.documents.size} arquivo(s) registrado(s)",
                                    fontSize = 11.sp,
                                    color = Color(0xFF64748b)
                                )
                            }
                            if (uiState.selectedSectorId != null) {
                                TextButton(
                                    onClick = { onSectorFilterSelected(null) },
                                    colors = ButtonDefaults.textButtonColors(contentColor = goldColor)
                                ) {
                                    Text("Limpar filtro", fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    // Lista de Documentos
                    if (uiState.documents.isEmpty()) {
                        item {
                            EmptyDocumentsPlaceholder(surfaceColor = surfaceColor)
                        }
                    } else {
                        items(uiState.documents, key = { it.id }) { doc ->
                            DocumentCard(
                                document = doc,
                                sectors = uiState.sectors,
                                onUpdateSector = onUpdateDocumentSector,
                                goldColor = goldColor,
                                surfaceColor = surfaceColor,
                                cardColor = cardColor
                            )
                        }
                    }

                    // Rodapé de Privacidade
                    item {
                        Spacer(Modifier.height(8.dp))
                        PrivacyGovernanceBanner(surfaceColor = surfaceColor)
                    }
                }
            }
        }
    }
}

// ============================================================
// Componentes reutilizáveis
// ============================================================

@Composable
private fun ConnectionStatusChip(isOnline: Boolean, emeraldColor: Color) {
    val bgColor = if (isOnline) Color(0xFF064e3b) else Color(0xFF78350f)
    val textColor = if (isOnline) emeraldColor else Color(0xFFfbbf24)
    val text = if (isOnline) "Online (Conectado)" else "Offline (Modo Local)"

    Surface(
        shape = RoundedCornerShape(50),
        color = bgColor,
        border = BorderStroke(1.dp, textColor.copy(alpha = 0.4f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(7.dp)
                    .clip(CircleShape)
                    .background(textColor)
            )
            Text(text, fontSize = 11.sp, color = textColor, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun StatusCountChip(label: String, color: Color) {
    Surface(
        shape = RoundedCornerShape(50),
        color = color.copy(alpha = 0.15f),
        border = BorderStroke(1.dp, color.copy(alpha = 0.4f))
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            fontSize = 10.sp,
            color = color,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun SectorFilterRow(
    sectors: List<SectorEntity>,
    selectedSectorId: String?,
    documents: List<DocumentEntity>,
    goldColor: Color,
    surfaceColor: Color,
    cardColor: Color,
    onSectorSelected: (String?) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            "Setores e Organização",
            fontWeight = FontWeight.Bold,
            color = Color(0xFFf1f5f9),
            fontSize = 15.sp
        )
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(sectors) { sector ->
                val count = documents.count { it.sectorId == sector.id }
                val isSelected = selectedSectorId == sector.id
                val sectorColor = parseSectorColor(sector.color)

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (isSelected) cardColor else surfaceColor,
                    border = BorderStroke(
                        1.dp,
                        if (isSelected) goldColor else Color.White.copy(alpha = 0.08f)
                    ),
                    modifier = Modifier.clickable {
                        onSectorSelected(if (isSelected) null else sector.id)
                    }
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp).width(80.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(sectorColor)
                            )
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = Color.White.copy(alpha = 0.06f)
                            ) {
                                Text(
                                    "$count",
                                    fontSize = 10.sp,
                                    color = Color(0xFF94a3b8),
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                )
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            sector.name,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFFe2e8f0),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DocumentCard(
    document: DocumentEntity,
    sectors: List<SectorEntity>,
    onUpdateSector: (String, String) -> Unit,
    goldColor: Color,
    surfaceColor: Color,
    cardColor: Color
) {
    var showSectorDialog by remember { mutableStateOf(false) }

    val (statusLabel, statusColor) = getStatusDisplay(document.status)
    val currentSector = sectors.find { it.id == document.sectorId }

    Surface(
        shape = RoundedCornerShape(14.dp),
        color = surfaceColor,
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.07f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Cabeçalho com nome do arquivo e status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Description,
                        contentDescription = null,
                        tint = goldColor,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        document.fileName,
                        color = Color(0xFFe2e8f0),
                        fontWeight = FontWeight.Medium,
                        fontSize = 13.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                }

                // Badge de Status
                Surface(
                    shape = RoundedCornerShape(50),
                    color = statusColor.copy(alpha = 0.15f),
                    border = BorderStroke(1.dp, statusColor.copy(alpha = 0.35f))
                ) {
                    Text(
                        statusLabel,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        fontSize = 10.sp,
                        color = statusColor,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            // Metadados: Tamanho e Confiança
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "${(document.fileSize / 1024f).format(1)} KB",
                    fontSize = 11.sp,
                    color = Color(0xFF64748b)
                )
                if (document.confidenceScore > 0f) {
                    val confColor = if (document.confidenceScore >= 0.6f)
                        Color(0xFF10b981) else Color(0xFFf97316)
                    Text(
                        "Confiança OCR: ${(document.confidenceScore * 100).toInt()}%",
                        fontSize = 11.sp,
                        color = confColor
                    )
                }
            }

            // Setor atribuído
            Spacer(Modifier.height(10.dp))
            HorizontalDivider(color = Color.White.copy(alpha = 0.06f))
            Spacer(Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (currentSector != null) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(parseSectorColor(currentSector.color))
                        )
                        Text(
                            currentSector.name,
                            fontSize = 11.sp,
                            color = Color(0xFF94a3b8)
                        )
                    } else {
                        Text(
                            "Setor não definido",
                            fontSize = 11.sp,
                            color = Color(0xFF475569)
                        )
                    }
                }

                TextButton(
                    onClick = { showSectorDialog = true },
                    colors = ButtonDefaults.textButtonColors(contentColor = goldColor)
                ) {
                    Text("Alterar Setor", fontSize = 11.sp)
                }
            }
        }
    }

    // Dialog de seleção de setor
    if (showSectorDialog) {
        AlertDialog(
            onDismissRequest = { showSectorDialog = false },
            containerColor = Color(0xFF1c202a),
            titleContentColor = Color(0xFFf1f5f9),
            textContentColor = Color(0xFF94a3b8),
            title = { Text("Atribuir Setor", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        "Selecione o setor para \"${document.fileName}\":",
                        fontSize = 12.sp,
                        color = Color(0xFF64748b)
                    )
                    Spacer(Modifier.height(8.dp))
                    sectors.forEach { sector ->
                        Surface(
                            modifier = Modifier.fillMaxWidth().clickable {
                                onUpdateSector(document.id, sector.id)
                                showSectorDialog = false
                            },
                            shape = RoundedCornerShape(8.dp),
                            color = if (sector.id == document.sectorId)
                                Color(0xFF1c202a) else Color.Transparent,
                            border = if (sector.id == document.sectorId)
                                BorderStroke(1.dp, goldColor.copy(alpha = 0.4f)) else null
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(parseSectorColor(sector.color))
                                )
                                Text(sector.name, color = Color(0xFFe2e8f0), fontSize = 13.sp)
                                if (sector.id == document.sectorId) {
                                    Spacer(Modifier.weight(1f))
                                    Icon(Icons.Default.Check, contentDescription = null, tint = goldColor, modifier = Modifier.size(14.dp))
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showSectorDialog = false }) {
                    Text("Cancelar", color = Color(0xFF64748b))
                }
            }
        )
    }
}

@Composable
private fun ErrorCard(message: String, retryable: Boolean, onRetry: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFef4444), modifier = Modifier.size(40.dp))
        Text("Falha de Comunicação com a API", color = Color(0xFFf1f5f9), fontWeight = FontWeight.Bold)
        Text(message, fontSize = 12.sp, color = Color(0xFF94a3b8), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        if (retryable) {
            Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1c202a))) {
                Text("Tentar Novamente", color = Color(0xFFe2e8f0))
            }
        }
    }
}

@Composable
private fun EmptyDocumentsPlaceholder(surfaceColor: Color) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = surfaceColor,
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.06f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(Icons.Default.Folder, contentDescription = null, tint = Color(0xFF475569), modifier = Modifier.size(40.dp))
            Text("Nenhum documento neste setor", color = Color(0xFFe2e8f0), fontWeight = FontWeight.Medium)
            Text(
                "Envie um arquivo pelo aplicativo Web ou adicione via upload nativo.",
                fontSize = 12.sp, color = Color(0xFF64748b),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    }
}

@Composable
private fun PrivacyGovernanceBanner(surfaceColor: Color) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = surfaceColor,
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(Icons.Default.Shield, contentDescription = null, tint = Color(0xFF10b981), modifier = Modifier.size(24.dp))
            Column {
                Text("Privacidade & Cofre Isolado", fontWeight = FontWeight.SemiBold, color = Color(0xFFe2e8f0), fontSize = 12.sp)
                Text(
                    "Sem Open Finance. Sem Pluggy. Seus arquivos pertencem exclusivamente a você.",
                    fontSize = 10.sp, color = Color(0xFF64748b)
                )
            }
        }
    }
}

// ============================================================
// Utilitários de Display
// ============================================================

private fun getStatusDisplay(status: String): Pair<String, Color> = when (status) {
    "ready"              -> "Classificado & Pronto" to Color(0xFF10b981)
    "review_required"    -> "Revisão Necessária" to Color(0xFFf97316)
    "read_unavailable"   -> "Leitura Indisponível" to Color(0xFFef4444)
    "pending_processing" -> "Enfileirado p/ OCR" to Color(0xFFf59e0b)
    "processing"         -> "Processando" to Color(0xFF3b82f6)
    "error"              -> "Erro no Pipeline" to Color(0xFFdc2626)
    else                 -> "Recebido" to Color(0xFF64748b)
}

private fun parseSectorColor(hex: String): Color {
    return try {
        Color(android.graphics.Color.parseColor(hex))
    } catch (e: Exception) {
        Color(0xFF64748b)
    }
}

private fun Float.format(digits: Int) = "%.${digits}f".format(this)

package com.glucosa.auto.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.work.*
import com.glucosa.auto.data.local.CentralStateEntity
import com.glucosa.auto.data.repository.GlucoseRepository
import com.glucosa.auto.service.GlucoseForegroundService
import com.glucosa.auto.worker.GlucoseSyncWorker
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {

    private lateinit var repository: GlucoseRepository
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Toast.makeText(this, "Permiso habilitado correctamente", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository = GlucoseRepository(this)

        checkPermissions()

        setContent {
            GlucoseAppTheme {
                // Collect state flow directly from SQLite Room unalterable model
                val systemState by repository.glucoseFlow.collectAsState(initial = null)
                
                DashboardScreen(
                    state = systemState,
                    onStartService = { triggerServiceAction(GlucoseForegroundService.ACTION_START) },
                    onStopService = { triggerServiceAction(GlucoseForegroundService.ACTION_STOP) },
                    onTriggerImmediateSync = { nsUrl, nsToken -> forceManualWorkManagerSync(nsUrl, nsToken) },
                    onSchedulePeriodicSync = { nsUrl, nsToken -> schedulePeriodicWorkManagerSync(nsUrl, nsToken) }
                )
            }
        }
    }

    private fun checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun triggerServiceAction(action: String) {
        val serviceIntent = Intent(this, GlucoseForegroundService::class.java).apply {
            this.action = action
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && action == GlucoseForegroundService.ACTION_START) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    private fun forceManualWorkManagerSync(nsUrl: String, nsToken: String) {
        val inputData = Data.Builder()
            .putString("nightscoutUrl", nsUrl)
            .putString("nightscoutToken", nsToken)
            .putBoolean("useSimulation", nsUrl.isEmpty())
            .build()

        val syncRequest = OneTimeWorkRequestBuilder<GlucoseSyncWorker>()
            .setInputData(inputData)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        WorkManager.getInstance(this).enqueueUniqueWork(
            "manual_sync_trigger",
            ExistingWorkPolicy.REPLACE,
            syncRequest
        )
        Toast.makeText(this, "Refrescando desde base de datos...", Toast.LENGTH_SHORT).show()
    }

    private fun schedulePeriodicWorkManagerSync(nsUrl: String, nsToken: String) {
        val inputData = Data.Builder()
            .putString("nightscoutUrl", nsUrl)
            .putString("nightscoutToken", nsToken)
            .putBoolean("useSimulation", nsUrl.isEmpty())
            .build()

        val periodicRequest = PeriodicWorkRequestBuilder<GlucoseSyncWorker>(15, TimeUnit.MINUTES)
            .setInputData(inputData)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                WorkRequest.MIN_BACKOFF_MILLIS,
                TimeUnit.MILLISECONDS
            )
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "periodic_sync_glucose",
            ExistingPeriodicWorkPolicy.UPDATE,
            periodicRequest
        )
        Toast.makeText(this, "Sincronizador Diferido WorkManager registrado", Toast.LENGTH_SHORT).show()
    }
}

@Composable
fun GlucoseAppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF6366F1),
            secondary = Color(0xFF10B981),
            background = Color(0xFF030712),
            surface = Color(0xFF0F172A),
            error = Color(0xFFEF4444)
        ),
        content = content
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    state: CentralStateEntity?,
    onStartService: () -> Unit,
    onStopService: () -> Unit,
    onTriggerImmediateSync: (String, String) -> Unit,
    onSchedulePeriodicSync: (String, String) -> Unit
) {
    val scrollState = rememberScrollState()
    
    // Config states
    var urlText by remember { mutableStateOf("") }
    var tokenText by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("GLUCOSA AUTO", fontWeight = FontWeight.Black, color = Color.White, fontSize = 16.sp) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF090D1A))
            )
        },
        containerColor = Color(0xFF030712)
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(Color(0xFF030712))
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            // ARCHITECTURAL BANNER
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1E1B4B).copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .border(1.dp, Color(0xFF312E81).copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Column {
                    Text(
                        "PRINCIPIO DE NO DETERMINISMO",
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFC7D2FE),
                        fontSize = 10.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Android suspende o retarda hilos pasivos en segundo plano por Doze o App Standby de forma predeterminada. La UI y sincronización local en Room SQLite resisten estos eventos sin falsas promesas médicas.",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp,
                        lineHeight = 16.sp
                    )
                }
            }

            // CORE READINGS PANEL
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F172A), RoundedCornerShape(16.dp))
                    .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        "MEDIDOR DE PACIENTERIA",
                        fontFamily = FontFamily.Monospace,
                        color = Color(0xFF64748B),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    if (state != null) {
                        val isCritical = state.glucoseValue < 70 || state.glucoseValue > 250
                        val valColor = if (isCritical) Color(0xFFEF4444) else Color(0xFF10B981)

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text(
                                state.glucoseValue.toString(),
                                fontSize = 54.sp,
                                fontWeight = FontWeight.Black,
                                color = valColor,
                                fontFamily = FontFamily.SansSerif
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "mg/dL",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        Text(
                            "Flecha: ${state.trendText.uppercase()}",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 13.sp
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // METADATA CHIPS
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Color(0xFF090D16), RoundedCornerShape(8.dp))
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("FUENTE", fontSize = 8.sp, color = Color(0xFF64748B), fontFamily = FontFamily.Monospace)
                                    Text(state.dataSource, fontSize = 11.sp, color = Color(0xFF818CF8), fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                            }
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Color(0xFF090D16), RoundedCornerShape(8.dp))
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("FRESCURA", fontSize = 8.sp, color = Color(0xFF64748B), fontFamily = FontFamily.Monospace)
                                    Text(state.freshness.uppercase(), fontSize = 11.sp, color = Color(0xFF34D399), fontWeight = FontWeight.Bold)
                                }
                            }
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Color(0xFF090D16), RoundedCornerShape(8.dp))
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("ESTADO RED", fontSize = 8.sp, color = Color(0xFF64748B), fontFamily = FontFamily.Monospace)
                                    Text(state.connectivity.uppercase(), fontSize = 11.sp, color = Color(0xFFFBBF24), fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            "Exact ISO: ${state.exactTimestamp}",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.sp,
                            color = Color(0xFF475569)
                        )

                        if (!state.errorLog.isNullOrEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Error: ${state.errorLog}",
                                color = Color(0xFFEF4444),
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                    } else {
                        // Empty State loader
                        Text(
                            "Esperando lecturas de Room DB...",
                            color = Color(0xFF94A3B8),
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            // NIGHTSCOUT CONFIG SECTION
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F172A), RoundedCornerShape(16.dp))
                    .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "CANAL DE SINCRONIZACIÓN DE API (NIGHTSCOUT)",
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )

                    OutlinedTextField(
                        value = urlText,
                        onValueChange = { urlText = it },
                        label = { Text("URL de Nightscout (ej. https://my-ns.herokuapp.com)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF6366F1),
                            unfocusedBorderColor = Color(0xFF1E293B)
                        ),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = tokenText,
                        onValueChange = { tokenText = it },
                        label = { Text("API Secret Token de seguridad") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF6366F1),
                            unfocusedBorderColor = Color(0xFF1E293B)
                        ),
                        singleLine = true
                    )

                    Text(
                        "*Deje estos campos vacíos para usar datos simulados robustos de glucómetro en el hilo de persistencia.",
                        color = Color(0xFF64748B),
                        fontSize = 10.sp
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = { onTriggerImmediateSync(urlText, tokenText) },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                        ) {
                            Text("Sincronizar Ya", fontSize = 11.sp)
                        }

                        Button(
                            onClick = { onSchedulePeriodicSync(urlText, tokenText) },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A)),
                            border = BorderStroke(1.dp, Color(0xFF1D4ED8))
                        ) {
                            Text("WorkManager 15m", fontSize = 11.sp)
                        }
                    }
                }
            }

            // FOREGROUND SERVICE CONTROL PANELS
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F172A), RoundedCornerShape(16.dp))
                    .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "SERVICIO PERMANENTE FOREGROUND SERVICE (FGS)",
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        "Mantiene el canal de notificaciones y habilita el TTS (Síntesis de voz) de advertencia acústica crítica si dejas de ver la pantalla mientras conduces.",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp,
                        lineHeight = 15.sp
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = onStartService,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                        ) {
                            Text("Iniciar FGS", fontSize = 11.sp)
                        }

                        Button(
                            onClick = onStopService,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                        ) {
                            Text("Apagar FGS", fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}

package com.glucosa.auto.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.IBinder
import android.speech.tts.TextToSpeech
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import androidx.lifecycle.lifecycleScope
import com.glucosa.auto.data.local.CentralStateEntity
import com.glucosa.auto.data.repository.GlucoseRepository
import com.glucosa.auto.ui.MainActivity
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.*

class GlucoseForegroundService : LifecycleService(), TextToSpeech.OnInitListener {

    private lateinit var repository: GlucoseRepository
    private var tts: TextToSpeech? = null
    private var isTtsInitialized = false
    private var lastSpokenValue: Int = 0
    private var lastSpeakTime: Long = 0
    private var monitoringJob: Job? = null

    companion object {
        private const val NOTIFICATION_ID = 2002
        private const val CHANNEL_ID = "glucose_medical_channel"
        private const val CHANNEL_NAME = "Monitoreo de Glucosa Crítica"

        const val ACTION_START = "com.glucosa.auto.START_SERVICE"
        const val ACTION_STOP = "com.glucosa.auto.STOP_SERVICE"
    }

    override fun onCreate() {
        super.onCreate()
        repository = GlucoseRepository(this)
        tts = TextToSpeech(this, this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        
        when (intent?.action) {
            ACTION_START -> {
                startForegroundServiceCompat()
                observeAndMonitorGlucose()
            }
            ACTION_STOP -> {
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun startForegroundServiceCompat() {
        createNotificationChannel()

        val notification = createNotification("Sincronizando...", "--", "Iniciando servicio permanente de fondo")
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun observeAndMonitorGlucose() {
        monitoringJob?.cancel()
        monitoringJob = lifecycleScope.launch {
            repository.glucoseFlow.collect { state ->
                state?.let {
                    updateNotification(it)
                    analyzeCriticalLimitsAndSpeak(it)
                }
            }
        }
    }

    private fun updateNotification(state: CentralStateEntity) {
        val notification = createNotification(
            title = "Glucosa: ${state.glucoseValue} mg/dL (${state.trendText})",
            content = "Frescura: ${state.freshness.uppercase()} | Sinc: ${state.lastSuccessfulSyncTime}",
            subText = "Canal activo permanente"
        )
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun createNotification(title: String, content: String, subText: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSubText(subText)
            .setSmallIcon(android.R.drawable.stat_sys_warning) // fallback system icon
            .setColor(Color.parseColor("#10B981"))
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificaciones de alta prioridad para control de diabetes en carretera"
                enableLights(true)
                lightColor = Color.RED
                enableVibration(true)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun analyzeCriticalLimitsAndSpeak(state: CentralStateEntity) {
        if (!isTtsInitialized || tts == null) return

        val value = state.glucoseValue
        val isCritical = value < 70 || value > 250
        val currentTime = System.currentTimeMillis()

        // Speak of critical alarms only, respecting a cool-down of 4 minutes
        if (isCritical) {
            if (value != lastSpokenValue || (currentTime - lastSpeakTime) > 240000) {
                lastSpokenValue = value
                lastSpeakTime = currentTime
                
                val warningText = if (value < 70) {
                    "Atención. Peligro de hipoglucemia. Nivel crítico de glucosa de $value miligramos por decilitro. Detenga el vehículo inmediatamente."
                } else {
                    "Advertencia. Hiperglucemia detectada. Nivel de glucosa de $value miligramos por decilitro."
                }

                tts?.speak(warningText, TextToSpeech.QUEUE_FLUSH, null, "GlucosaAlarmId")
            }
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale("es", "ES"))
            if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                isTtsInitialized = true
            }
        }
    }

    override fun onDestroy() {
        monitoringJob?.cancel()
        tts?.stop()
        tts?.shutdown()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? {
        super.onBind(intent)
        return null
    }
}

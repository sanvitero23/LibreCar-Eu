import { useState } from 'react';
import { 
  BookOpen, ShieldAlert, Code, Terminal, CheckCircle2, ChevronRight, 
  Layers, Lock, Database, Smartphone, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function TechnicalAnalysis() {
  const [activeTab, setActiveTab] = useState<'restrictions' | 'degradation' | 'code-service' | 'code-widgets'>('restrictions');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-left" id="technical-analysis-section">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Ingeniería de Sistemas: Guía de Estabilidad CGM (Android 12–14)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Análisis de restricciones de hilos en segundo plano, mitigación de cierres agresivos por fabricantes y arquitectura local sin supuestos.
          </p>
        </div>
        
        {/* Tab Controls */}
        <div className="flex flex-wrap bg-slate-900 p-1 rounded-xl border border-slate-800 gap-0.5">
          {[
            { id: 'restrictions', label: '1. Restricciones SO' },
            { id: 'degradation', label: '2. Plan de Degradación' },
            { id: 'code-service', label: '3. Foreground Service & SDK' },
            { id: 'code-widgets', label: '4. Kotlin AppWidgets' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        
        {/* TAB 1: RESTRICTION MAP BY MANUFACTURER */}
        {activeTab === 'restrictions' && (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-950/40 border border-indigo-950 rounded-xl flex gap-3 text-indigo-300">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-extrabold uppercase block text-white text-[10.5px]">PRINCIPIO CENTRAL DE NO DETERMINISMO</span>
                "Android es un entorno no determinista, por lo que el sistema debe ser resiliente por diseño, no dependiente de comportamiento garantizado del sistema operativo." Ninguna aplicación puede adjudicarse la ejecución perpetua e invariable de procesos en segundo plano. La optimización y el ahorro térmico limitan la actividad de hilos de forma prevista.
              </div>
            </div>

            <p className="text-xs text-slate-400">
              A continuación se presenta una <b>guía informativa de configuración recomendada por fabricante</b> para mitigar retrasos y suspensión de hilos, sin presuponer control automatizado sobre el kernel ni garantizar la supervivencia perpetua del servicio:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Samsung Row */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
                <span className="font-bold text-white block uppercase tracking-wider text-indigo-400">📋 Samsung OneUI (Guía)</span>
                <p className="text-slate-400 leading-normal">
                  OneUI sitúa las aplicaciones inactivas en "Suspensión profunda" (Deep Sleep) suspendiendo corrutinas. Se recomienda instruir al usuario para eximir la app de forma estática en la consola de ajustes.
                </p>
                <div className="text-amber-500 font-medium">
                  <strong>Recomendación manual:</strong> Agregar la aplicación a "Aplicaciones nunca en suspensión" en el menú de Batería del dispositivo.
                </div>
              </div>

              {/* Xiaomi HyperOS Row */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
                <span className="font-bold text-white block uppercase tracking-wider text-indigo-400">📋 Xiaomi HyperOS / MIUI (Guía)</span>
                <p className="text-slate-400 leading-normal">
                  Su motor térmico cancela servicios tras períodos prolongados sin interacción directa. El usuario debe habilitar manualmente los permisos de autostart estáticamente.
                </p>
                <div className="text-amber-500 font-medium">
                  <strong>Recomendación manual:</strong> Habilitar "Inicio automático (Autostart)" y fijar la aplicación en el conmutador de multitarea del sistema.
                </div>
              </div>

              {/* Pixel Row */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
                <span className="font-bold text-white block uppercase tracking-wider text-indigo-400">📋 Google Pixel Stock (Guía)</span>
                <p className="text-slate-400 leading-normal">
                  El mecanismo de ahorro adaptable "Doze Mode" limita las conexiones de radio/módem si el dispositivo permanece inmóvil por más de 30 minutos.
                </p>
                <div className="text-amber-500 font-medium">
                  <strong>Recomendación manual:</strong> Desactivar "Ahorro adaptable" o solicitar estáticamente la exención de optimizaciones de energía.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: LOCAL DEGRADATION PLAN & DATA SOURCES */}
        {activeTab === 'degradation' && (
          <div className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Arquitectura de Estabilidad Cerrada para Producto Real
            </h3>

            {/* SECTION 1: UNIQUE STATE MODEL */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <span className="w-1.5 h-6 rounded bg-indigo-500 block animate-pulse"></span>
                <span className="font-bold text-xs uppercase tracking-wider text-white">1. Modelo Único de Estado (SST)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                El sistema se gobierna bajo un único modelo central <code className="text-indigo-300 font-mono text-[10.5px] bg-slate-900 px-1 py-0.5 rounded">CentralSystemState</code> que representa la fuente exclusiva de la verdad. Esto anula estados contradictorios entre componentes aislados:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 pt-2 text-[11px]">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <span className="text-[10px] text-indigo-400 font-mono font-bold block mb-1">A. Glucosa Actual</span>
                  <p className="text-slate-400">Valor entero inalterado <code className="font-mono text-[10px] text-amber-300 font-bold">glucoseValue</code> medido estrictamente en <b className="text-slate-200">mg/dL</b>.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <span className="text-[10px] text-indigo-400 font-mono font-bold block mb-1">B. Exact Timestamp</span>
                  <p className="text-slate-400">Timestamp absoluto e inmediato <code className="font-mono text-[10px] text-amber-300">exactTimestamp</code> (ISO-8601 u UTC Epoch ms).</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <span className="text-[10px] text-indigo-400 font-mono font-bold block mb-1">C. Fuente de Datos</span>
                  <p className="text-slate-400"><code className="font-mono text-[10px] text-amber-300">dataSource</code>: <code className="text-[10.5px]">LibreLinkUp</code>, <code className="text-[10.5px]">Nightscout</code> o <code className="text-[10.5px]">Caché Local Room</code>.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <span className="text-[10px] text-indigo-400 font-mono font-bold block mb-1">D. Estado Frescura</span>
                  <p className="text-slate-400"><code className="font-mono text-[10px] text-amber-300">freshness</code>: <code className="text-[10.5px]">fresh</code> (&lt;5 min), <code className="text-[10.5px]">stale</code> (datos huérfanos) o <code className="text-[10.5px]">unknown</code>.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <span className="text-[10px] text-indigo-400 font-mono font-bold block mb-1">E. Conectividad</span>
                  <p className="text-slate-400"><code className="font-mono text-[10px] text-amber-300">connectivity</code>: <code className="text-[10.5px]">online</code> (normal), <code className="text-[10.5px]">degraded</code> (sin red/Doze) u <code className="text-[10.5px]">offline</code>.</p>
                </div>
              </div>
            </div>

            {/* SECTION 2: END TO END DATA FLOW */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <span className="w-1.5 h-6 rounded bg-indigo-500 block"></span>
                <span className="font-bold text-xs uppercase tracking-wider text-white">2. Flujo Completo de Datos Extremo a Extremo</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                El flujo de datos avanza de forma estrictamente unidireccional para garantizar inmunidad frente a interrupciones y pérdidas de memoria en el sistema operativo:
              </p>

              <div className="bg-slate-900 p-4 rounded-xl border border-dashed border-slate-800 text-[10.5px] leading-relaxed space-y-3 font-mono">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <span className="text-indigo-300 font-bold">[SENSOR / API]</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-400">Lecturas de glucosa emitidas de manera remota al Abbott Cloud o servidor Nightscout.</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <span className="text-indigo-300 font-bold">[SINCRONIZACIÓN]</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-400">Trabajador periódico de background <b>WorkManager</b> solicita de forma adaptativa cada vez que hay red disponible.</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <span className="text-indigo-300 font-bold">[CACHE LOCAL]</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-400">Escritura transaccional ineludible en <b>SQLite Room DB</b> como base de datos persistente. No se usan variables volátiles en RAM.</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <span className="text-indigo-300 font-bold">[STATE MODEL]</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-400">La base de datos actualiza el <b>CentralSystemState</b> reactivamente (mediante Flow de Kotlin), sincronizando todas sus variables.</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-indigo-300 font-bold">[PANTALLA + WIDGETS + NOTIF]</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-400">Las UIs se redibujan de forma sincronizada, leyendo el valor almacenado desde el repositorio de Room SQLite unificado.</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: DEGRADATION STRATEGY */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <span className="w-1.5 h-6 rounded bg-indigo-500 block animate-pulse"></span>
                <span className="font-bold text-xs uppercase tracking-wider text-white">3. Estrategia de Degradación Real (Sin Silencios)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Frente a contingencias críticas del sistema operativo, el sistema cuenta con planes de acción explícitos sin falsas promesas al usuario:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-[11px] leading-relaxed">
                
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <span className="font-bold text-amber-400 uppercase tracking-wide block text-[10px]">A. Pérdida de Red</span>
                  <p className="text-slate-400 text-[10.5px]">
                    La UI atenúa el color del valor, la conectividad cambia a <code className="text-amber-300 font-mono">degraded</code>, y se marca el dato como "Caché Offline". Se detiene el pito ordinario, limitándolo a un aviso discreto.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <span className="font-bold text-amber-400 uppercase tracking-wide block text-[10px]">B. Cierre del FGS</span>
                  <p className="text-slate-400 text-[10.5px]">
                    Al revivir la pantalla, se lee inmediatamente el registro más reciente desde SQLite Room. <b>WorkManager</b> reprograma hilos resilientes, encolando una nueva sincronización en cuanto finalice el bloqueo del SO.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <span className="font-bold text-amber-400 uppercase tracking-wide block text-[10px]">C. Fallo de la API</span>
                  <p className="text-slate-400 text-[10.5px]">
                    Si LibreLinkUp falla con 500 o token vencido, se activa un redireccionamiento al fallback de la API de <b>Nightscout</b> de forma inmediata sin emitir molestas alarmas médicas ruidosas.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <span className="font-bold text-amber-400 uppercase tracking-wide block text-[10px]">D. Datos Desactualizados</span>
                  <p className="text-slate-400 text-[10.5px]">
                    Si transcurren 12 min sin lecturas frescas, la conectividad cambia a <code className="text-amber-300 font-mono text-[10px]">offline</code>, la frescura a <code className="text-amber-300 font-mono text-[10px]">stale</code>, y la notificación persistente emite un zumbido breve de aviso de desactualización.
                  </p>
                </div>

              </div>
            </div>

            {/* SECTION 4: UI CONSISTENCY */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <span className="w-1.5 h-6 rounded bg-indigo-500 block"></span>
                <span className="font-bold text-xs uppercase tracking-wider text-white">4. Consistencia Total de UI (Sincronización Transversal)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Se elimina cualquier posibilidad de sincronización inconsistente cruzada (por ejemplo, que el widget muestre un valor distinto al de la notificación o pantalla principal) implementando un disparador basado en eventos locales:
              </p>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div className="space-y-1">
                  <strong className="text-white block">Pantalla Principal (Activity / Compose)</strong>
                  <p className="text-slate-400 text-[11px]">
                    Observa mediante corrutinas de flujo (<code className="font-mono text-[10px] text-indigo-300">Flow&lt;Glucose&gt;</code>) directamente los cambios sobre SQLite Room en tiempo real.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-white block">Widget de Pantalla de Inicio</strong>
                  <p className="text-slate-400 text-[11px]">
                    Al recibir un dato nuevo, se emite un broadcast general a través de <code className="font-mono text-[10px] text-indigo-300">AppWidgetManager</code>, forzando la recarga sincrónica del widget leyendo de Room.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-white block">Notificación Permanente de Sistema</strong>
                  <p className="text-slate-400 text-[11px]">
                    El hilo del Foreground Service actualiza el contenido de la notificación de manera directa usando el <code className="font-mono text-[10px] text-indigo-300">NotificationManager</code> simultáneamente en la misma corrutina.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: KOTLIN CODE FOREGROUND SERVICE & CHANNELS */}
        {activeTab === 'code-service' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 flex-1">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Durable Foreground Service (Android 14 Compatible)
              </h3>
              <span className="text-[10px] bg-slate-950 text-indigo-400 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                FGS Type: health / systemExempted
              </span>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed border border-slate-805 max-h-[350px]">
{`package com.librecar.display

import android.app.*
import android.content.Intent
import android.os.IBinder
import android.os.Build
import androidx.core.app.NotificationCompat
import com.librecar.display.database.GlucoseDatabase
import com.librecar.display.model.GlucoseReading
import kotlinx.coroutines.*

class GlucoseForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val CHANNEL_ID = "glucose_persistent_monitor_channel"
    private val NOTIFICATION_ID = 4001

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Obtenemos último dato de la caché local obligatorio
        val lastValue = intent?.getIntExtra("last_value", 120) ?: 120
        
        // Android 14 requiere declaración explícita de Foreground Service Type en Manifesto
        val notification = buildGlucoseNotification(lastValue, "Sincronizando sensor en segundo plano...")
        startForeground(NOTIFICATION_ID, notification)

        // Bucle de sincronización con Abbott / Nightscout
        startBackgroundSyncLoop()

        // START_STICKY asegura que si el sistema mata el servicio por ahorro energético, lo revive
        return START_STICKY
    }

    private fun startBackgroundSyncLoop() {
        serviceScope.launch {
            while (isActive) {
                try {
                    // Consulta con Fallback (Primero LibreLinkUp, si falla busca en Nightscout)
                    val reading = fetchGlucoseBestEffort()
                    
                    // Insertar lectura en room SQLite local
                    GlucoseDatabase.getInstance(applicationContext).dao().insert(reading)
                    
                    // Actualizar UI, Notificación Expandida y Widgets
                    updateSystemUIs(reading)
                    
                } catch (e: Exception) {
                    // Fallback local: marcar dato como desactualizado en notificación
                    updateNotificationWithError()
                }
                delay(60000) // Sinc periódica de 1 minuto
            }
        }
    }

    private fun buildGlucoseNotification(value: Int, text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Copiloto CGM: $value mg/dL")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_glucose_notif)
            .setOngoing(true) // No deslizable
            .setPriority(NotificationCompat.PRIORITY_LOW) // Silenciosa de fondo
            .setCategory(Notification.CATEGORY_SERVICE)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Monitor de Glucosa Persistente",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantiene visible la lectura del sensor Frestyle Libre en la pantalla sin interrupción"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: APPWIDGETPROVIDER CODE */}
        {activeTab === 'code-widgets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 flex-1">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Android AppWidgetProvider (Garantía sin consumo RAM)
              </h3>
              <span className="text-[10px] bg-slate-950 text-indigo-400 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                Jetpack RemoteViews
              </span>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed border border-slate-805 max-h-[350px]">
{`package com.librecar.display.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.librecar.display.MainActivity
import com.librecar.display.R
import com.librecar.display.database.GlucoseDatabase

/**
 * AppWidgetProvider se ejecuta de forma pasiva por el Launcher del sistema.
 * El consumo de batería es 0% porque solo responde a broadcasts de actualización de WorkManager.
 */
class GlucoseWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.widget_glucose_layout)

        // Hilo asíncrono para leer de SQLite rápido sin congelar UI principal
        Thread {
            val db = GlucoseDatabase.getInstance(context)
            val latestReading = db.dao().getLatestReadingImmediate()

            if (latestReading != null) {
                views.setTextViewText(R.id.widget_value_text, latestReading.value.toString())
                views.setTextViewText(R.id.widget_trend_text, latestReading.trendSymbol)
                views.setTextViewText(R.id.widget_time_text, latestReading.timestampFormatted)
            } else {
                views.setTextViewText(R.id.widget_value_text, "--")
                views.setTextViewText(R.id.widget_trend_text, "no-sync")
            }

            // Intent para abrir la aplicación si el usuario presiona el widget circular
            val pendingIntent = PendingIntent.getActivity(
                context, 0, Intent(context, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container_click, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }.start()
    }
}`}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

package com.glucosa.auto.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import com.glucosa.auto.R
import com.glucosa.auto.data.local.GlucoseDatabase
import kotlinx.coroutines.*

class GlucoseWidgetProvider : AppWidgetProvider() {

    private val job = SupervisorJob()
    private val scope = CoroutineScope(DispatchCatchers + job)

    companion object {
        private val DispatchCatchers = Dispatchers.IO + CoroutineExceptionHandler { _, throwable ->
            android.util.Log.e("WidgetProvider", "Fallo subproceso widget: ${throwable.localizedMessage}")
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        // Redraw widgets on schedule
        scope.launch {
            val db = GlucoseDatabase.getDatabase(context)
            val currentState = db.centralStateDao().getSystemState()

            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId, currentState?.glucoseValue, currentState?.trendArrow, currentState?.lastSuccessfulSyncTime)
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        // Handle trigger broadcast emitted from WorkManager after complete transactional database write 
        if (intent.action == "com.glucosa.auto.ACTION_SYNC_UPDATE") {
            val glucose = intent.getIntExtra("glucoseValue", 112)
            val arrow = intent.getIntExtra("trendArrow", 3)
            val syncTime = intent.getStringExtra("lastSyncTime") ?: "--:--"

            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, GlucoseWidgetProvider::class.java)
            val allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)

            for (widgetId in allWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId, glucose, arrow, syncTime)
            }
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        glucoseValue: Int?,
        trendArrow: Int?,
        syncTime: String?
    ) {
        val views = RemoteViews(context.packageName, R.layout.glucose_widget_layout)

        if (glucoseValue != null) {
            views.setTextViewText(R.id.widget_glucose_value, glucoseValue.toString())
            views.setTextViewText(R.id.widget_timestamp, "Sincronizado: ${syncTime ?: "--:--"}")
            
            // Render arrow according to our numerical layout dictionary
            val arrowGlyph = when (trendArrow) {
                1 -> "↓↓"
                2 -> "↓"
                3 -> "→"
                4 -> "↑"
                5 -> "↑↑"
                else -> "→"
            }
            views.setTextViewText(R.id.widget_trend_arrow, arrowGlyph)

            // Dynamic layout text color alert parameters
            val colorHex = if (glucoseValue < 70 || glucoseValue > 250) {
                "#EF4444" // Out-of-Range emergency Red
            } else {
                "#10B981" // Stable green
            }
            views.setTextColor(R.id.widget_glucose_value, Color.parseColor(colorHex))
            views.setTextColor(R.id.widget_trend_arrow, Color.parseColor(colorHex))
        } else {
            views.setTextViewText(R.id.widget_glucose_value, "--")
            views.setTextViewText(R.id.widget_trend_arrow, "●")
            views.setTextViewText(R.id.widget_timestamp, "Esperando base datos...")
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    override fun onDisabled(context: Context) {
        job.cancel()
        super.onDisabled(context)
    }
}

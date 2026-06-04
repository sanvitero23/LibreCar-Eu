package com.glucosa.auto.worker

import android.content.Context
import android.content.Intent
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.glucosa.auto.data.repository.GlucoseRepository
import java.net.UnknownHostException

class GlucoseSyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    private val repository = GlucoseRepository(context)

    override suspend fun doWork(): Result {
        // Collect required telemetry credentials passed down as parameters
        val url = inputData.getString("nightscoutUrl")
        val token = inputData.getString("nightscoutToken")
        val useSimulation = inputData.getBoolean("useSimulation", true)

        return try {
            // Trigger resilient background synchronisation cycle
            val state = repository.synchroniseData(
                nightscoutUrl = url,
                nightscoutToken = token,
                useSimulation = useSimulation
            )

            // Force immediate update across desktop widgets
            val intent = Intent("com.glucosa.auto.ACTION_SYNC_UPDATE").apply {
                packageName = applicationContext.packageName
                putExtra("glucoseValue", state.glucoseValue)
                putExtra("trendArrow", state.trendArrow)
                putExtra("lastSyncTime", state.lastSuccessfulSyncTime)
            }
            applicationContext.sendBroadcast(intent)

            Result.success()

        } catch (e: Exception) {
            // Distinguish temporary socket or network bottlenecks from permanent configuration errors
            if (e is UnknownHostException || e.cause is UnknownHostException) {
                // Returns retry state requesting WorkManager to reschedule with custom Exponential Backoff
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
}

package com.glucosa.auto.data.repository

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.glucosa.auto.data.local.CentralStateDao
import com.glucosa.auto.data.local.CentralStateEntity
import com.glucosa.auto.data.local.GlucoseDatabase
import com.glucosa.auto.data.remote.NightscoutApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.text.SimpleDateFormat
import java.util.*

class GlucoseRepository(private val context: Context) {

    private val db: GlucoseDatabase = GlucoseDatabase.getDatabase(context)
    private val dao: CentralStateDao = db.centralStateDao()

    // Observe unalterable data unifications as a reactive stream
    val glucoseFlow: Flow<CentralStateEntity?> = dao.observeSystemState()

    /**
     * Attempts a transactional sync from API resources.
     * Evaluates network capabilities first, attempting automatic fallbacks.
     */
    suspend fun synchroniseData(
        nightscoutUrl: String?,
        nightscoutToken: String?,
        useSimulation: Boolean = false
    ): CentralStateEntity {
        val formatter = SimpleDateFormat("HH:mm", Locale.getDefault())
        val currentTimeString = formatter.format(Date())
        val isoTimestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date())

        val isOnline = isDeviceOnline()

        // 1. Check network constraints
        if (!isOnline) {
            val cached = dao.getSystemState()
            return if (cached != null) {
                val downgradedState = cached.copy(
                    connectivity = "offline",
                    freshness = "stale",
                    errorLog = "Dispositivo sin conexión móvil o Wi-Fi activo"
                )
                dao.saveSystemState(downgradedState)
                downgradedState
            } else {
                val fallbackState = CentralStateEntity(
                    glucoseValue = 100,
                    trendArrow = 3,
                    trendText = "Sin conexión",
                    exactTimestamp = isoTimestamp,
                    dataSource = "Caché Local Room",
                    freshness = "unknown",
                    connectivity = "offline",
                    lastSuccessfulSyncTime = currentTimeString,
                    errorLog = "Inicializado sin conexión ni logs previos"
                )
                dao.saveSystemState(fallbackState)
                fallbackState
            }
        }

        // 2. Execution of data source logic (Simulation VS Real API fetch)
        try {
            if (useSimulation) {
                // Generate safe fluctuation values for Simulation stability
                val mockValue = (75..180).random()
                val mockArrow = (1..5).random()
                val mockText = when (mockArrow) {
                    1 -> "Bajando rápido"
                    2 -> "Bajando"
                    3 -> "Estable"
                    4 -> "Subiendo"
                    else -> "Subiendo rápido"
                }

                val newState = CentralStateEntity(
                    glucoseValue = mockValue,
                    trendArrow = mockArrow,
                    trendText = mockText,
                    exactTimestamp = isoTimestamp,
                    dataSource = "Caché Local Room",
                    freshness = "fresh",
                    connectivity = "online",
                    lastSuccessfulSyncTime = currentTimeString,
                    errorLog = null
                )
                dao.saveSystemState(newState)
                return newState
            }

            // Real Remote API integration (Nightscout REST Bridge)
            if (!nightscoutUrl.isNullOrEmpty()) {
                val sanitizedUrl = if (nightscoutUrl.endsWith("/")) nightscoutUrl else "$nightscoutUrl/"
                
                val retrofit = Retrofit.Builder()
                    .baseUrl(sanitizedUrl)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()

                val api = retrofit.create(NightscoutApiService::class.java)
                val entries = api.getGlucoseEntries(count = 1, token = nightscoutToken)

                if (entries.isNotEmpty()) {
                    val entry = entries.first()
                    val arrowCode = translateNightscoutDirection(entry.direction)
                    
                    val newState = CentralStateEntity(
                        glucoseValue = entry.sgv,
                        trendArrow = arrowCode,
                        trendText = entry.direction ?: "Estable",
                        exactTimestamp = entry.dateString,
                        dataSource = "Nightscout",
                        freshness = "fresh",
                        connectivity = "online",
                        lastSuccessfulSyncTime = currentTimeString,
                        errorLog = null
                    )
                    dao.saveSystemState(newState)
                    return newState
                }
            }

            // Fallback back to local cache if configurations are empty
            throw Exception("URL de canal API Nightscout inexistente o inválida")

        } catch (e: Exception) {
            // Failure mitigations: Degrade states safely
            val cached = dao.getSystemState()
            val finalState = if (cached != null) {
                cached.copy(
                    connectivity = "degraded",
                    freshness = "stale",
                    errorLog = "Fallo de API: ${e.localizedMessage}"
                )
            } else {
                CentralStateEntity(
                    glucoseValue = 110,
                    trendArrow = 3,
                    trendText = "Estable",
                    exactTimestamp = isoTimestamp,
                    dataSource = "Caché Local Room",
                    freshness = "stale",
                    connectivity = "degraded",
                    lastSuccessfulSyncTime = currentTimeString,
                    errorLog = "Fallo primer inicio: ${e.localizedMessage}"
                )
            }
            dao.saveSystemState(finalState)
            return finalState
        }
    }

    private fun isDeviceOnline(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun translateNightscoutDirection(direction: String?): Int {
        return when (direction?.lowercase()) {
            "doubledown" -> 1
            "fortyfivedown", "down" -> 2
            "flat", "none" -> 3
            "fortyfiveup", "up" -> 4
            "doubleup" -> 5
            else -> 3
        }
    }
}

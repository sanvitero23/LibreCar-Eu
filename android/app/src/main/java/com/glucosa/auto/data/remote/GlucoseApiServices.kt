package com.glucosa.auto.data.remote

import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query

// Retrofit structure for direct Nightscout connectivity
interface NightscoutApiService {
    @GET("api/v1/entries/sgv.json")
    suspend fun getGlucoseEntries(
        @Query("count") count: Int = 1,
        @Header("api-secret") token: String? = null
    ): List<NightscoutGlucoseEntry>
}

data class NightscoutGlucoseEntry(
    val sgv: Int,          // Glucose reading value (mg/dL)
    val dateString: String, // ISO date string representation
    val direction: String?  // e.g. "Flat", "FortyFiveUp", "SingleUp" etc
)

// Retrofit interfaces representing LibreLinkUp network payloads (Simulated/Mocked logic fallback)
data class LibreGlucoseEntry(
    val value: Int,
    val trendArrow: Int,
    val trendText: String,
    val timestamp: String
)

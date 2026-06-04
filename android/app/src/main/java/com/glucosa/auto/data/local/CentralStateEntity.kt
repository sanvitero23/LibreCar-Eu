package com.glucosa.auto.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

// Single constant source of truth representing "CentralSystemState" matching exactly our design model
@Entity(tableName = "central_system_state")
data class CentralStateEntity(
    @PrimaryKey val id: Int = 1, // Single row constraint (only 1 state exists)
    val glucoseValue: Int,
    val trendArrow: Int, // 1: DownDown, 2: Down, 3: Flat, 4: Up, 5: UpUp, other: None
    val trendText: String,
    val exactTimestamp: String, // Precise UTC timestamp String
    val dataSource: String, // "LibreLinkUp" | "Nightscout" | "Caché Local Room"
    val freshness: String, // "fresh" | "stale" | "unknown"
    val connectivity: String, // "online" | "degraded" | "offline"
    val lastSuccessfulSyncTime: String,
    val errorLog: String? = null
)

@Dao
interface CentralStateDao {
    @Query("SELECT * FROM central_system_state WHERE id = 1 LIMIT 1")
    fun getSystemState(): CentralStateEntity?

    @Query("SELECT * FROM central_system_state WHERE id = 1 LIMIT 1")
    fun observeSystemState(): Flow<CentralStateEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSystemState(state: CentralStateEntity)
}

package com.glucosa.auto.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [CentralStateEntity::class], version = 1, exportSchema = false)
abstract class GlucoseDatabase : RoomDatabase() {
    abstract fun centralStateDao(): CentralStateDao

    companion object {
        @Volatile
        private var INSTANCE: GlucoseDatabase? = null

        fun getDatabase(context: Context): GlucoseDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    GlucoseDatabase::class.java,
                    "glucose_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

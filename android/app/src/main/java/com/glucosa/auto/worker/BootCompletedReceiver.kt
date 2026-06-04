package com.glucosa.auto.worker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.glucosa.auto.service.GlucoseForegroundService

class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            
            // Re-boot Foreground Service to preserve continuity
            val serviceIntent = Intent(context, GlucoseForegroundService::class.java).apply {
                action = GlucoseForegroundService.ACTION_START
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
}

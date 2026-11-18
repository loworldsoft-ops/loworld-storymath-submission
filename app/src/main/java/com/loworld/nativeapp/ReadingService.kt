package com.loworld.nativeapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

/**
 * 읽는 동안 앱을 살려 둔다. 화면을 끄거나 앱을 뒤로 보내도 낭독이 이어지게.
 *
 * 전에는 읽는 동안 화면을 켜 두는 것(keepScreenOn)뿐이었다. 사용자가 화면을 끄거나 뒤로 보내면 CPU가 잠들어
 * 다음 문장을 합성하지 못했다(폴드6에서 재 보니 화면이 잠기자 합성이 멈췄다, 2026-11-16).
 * 포그라운드 서비스(미디어 재생)로 앱이 뒤에서도 우선순위를 지키게 하고, 부분 깨우기 잠금으로 CPU가 잠들지 않게 한다.
 * 알림은 서비스의 조건이라 띄운다. 누르면 앱으로 돌아온다.
 *
 * 켜고 끄는 것은 통로(LoworldNativeBridge)가 화면을 켜 두는 것과 같은 때에 한다: 읽기를 시작하면 켜고,
 * 마지막 읽기가 끝나고 잠시(다음 화를 여는 시간) 뒤에 끈다.
 */
class ReadingService : Service() {
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = notification()
        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK else 0
        runCatching { ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type) }
            .onFailure {
                // 뒤에서는 포그라운드 서비스를 새로 시작하지 못한다(안드로이드 12부터). 그때는 화면을 켜 둔 것만으로 읽는다
                Log.w(TAG, "포그라운드로 올리지 못했다: ${it.message}")
                stopSelf()
                return START_NOT_STICKY
            }
        if (wakeLock == null) {
            val power = getSystemService(PowerManager::class.java)
            wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "loworld:reading").apply {
                setReferenceCounted(false)
                // 끄는 것을 놓쳐도 배터리를 끝없이 쓰지 않게 상한을 둔다. 읽기가 이어지면 다시 시작해 늘린다
                acquire(WAKE_LIMIT_MS)
            }
        } else {
            wakeLock?.acquire(WAKE_LIMIT_MS)
        }
        // 시스템이 서비스를 죽여도 되살리지 않는다. 웹이 다시 읽기를 시작할 때 켠다
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        runCatching { wakeLock?.takeIf { it.isHeld }?.release() }
        wakeLock = null
        super.onDestroy()
    }

    private fun notification(): Notification {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager.getNotificationChannel(CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, getString(R.string.reading_channel), NotificationManager.IMPORTANCE_LOW).apply {
                    setShowBadge(false)
                },
            )
        }
        val open = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        }
        val content = open?.let { PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT) }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.reading_now))
            .setContentIntent(content)
            .setOngoing(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()
    }

    companion object {
        private const val TAG = "ReadingService"
        private const val CHANNEL_ID = "reading"
        private const val NOTIFICATION_ID = 7101
        /** 깨우기 잠금의 상한. 한 화를 다 읽기에 넉넉하다. 읽기마다 다시 건다 */
        private const val WAKE_LIMIT_MS = 60 * 60 * 1000L

        /** 읽기를 시작했다. 이미 떠 있으면 깨우기 잠금만 늘린다 */
        fun start(context: Context) {
            runCatching { ContextCompat.startForegroundService(context, Intent(context, ReadingService::class.java)) }
                .onFailure { Log.w(TAG, "서비스를 시작하지 못했다: ${it.message}") }
        }

        fun stop(context: Context) {
            runCatching { context.stopService(Intent(context, ReadingService::class.java)) }
        }
    }
}

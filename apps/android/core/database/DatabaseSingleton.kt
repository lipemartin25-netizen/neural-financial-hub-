package com.neurafin.hub.core.data.local

import android.content.Context
import androidx.room.Room

/**
 * Singleton do banco de dados Room do Neurafin Hub.
 * Thread-safe via double-checked locking.
 */
private var INSTANCE: NeurafinDatabase? = null

fun NeurafinDatabase.Companion.getInstance(context: Context): NeurafinDatabase {
    return INSTANCE ?: synchronized(this) {
        INSTANCE ?: Room.databaseBuilder(
            context.applicationContext,
            NeurafinDatabase::class.java,
            NeurafinDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration()
            .build()
            .also { INSTANCE = it }
    }
}

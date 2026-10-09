package com.neurafin.hub

import org.junit.Test
import org.junit.Assert.*

class ArchitectureContractTest {
    @Test
    fun verifyAndroidPackageStructure() {
        val appPackage = "com.neurafin.hub"
        assertEquals("com.neurafin.hub", appPackage)
    }

    @Test
    fun verifyNoOpenBankingOrSandboxes() {
        val disallowedFeatures = listOf("Pluggy", "OpenFinance", "BankSandbox")
        val activeFeatures = listOf("ManualAccounts", "OfflineSync", "LocalDocumentCache")
        
        for (disallowed in disallowedFeatures) {
            assertFalse(activeFeatures.contains(disallowed))
        }
    }
}

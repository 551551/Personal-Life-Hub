package com.personallifehub.app;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class ApplicationIdTest {
    @Test
    public void applicationId_isStable() {
        assertEquals("com.personallifehub.app", BuildConfig.APPLICATION_ID);
    }
}

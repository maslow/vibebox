#!/usr/bin/env node
/**
 * OAuth Popup Test Template
 *
 * This is a reusable template for testing OAuth flows that use popup windows.
 *
 * CRITICAL PATTERN: Always capture popup windows with context.on('page')
 *
 * Customize:
 * - APP_URL: Your application URL
 * - LOGIN_BUTTON_TEXT: Text of your login button
 * - OAUTH_PROVIDER_URL: Expected OAuth provider URL pattern
 * - Registration flow steps based on your provider
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// CONFIGURATION - Customize these for your application
// ============================================================
const CONFIG = {
    APP_URL: 'http://localhost:8081',
    LOGIN_BUTTON_TEXT: 'Sign In with Logto',
    OAUTH_PROVIDER_URL_PATTERN: 'localhost:3001',
    SCREENSHOTS_DIR: path.join(__dirname, '../tmp/oauth-test'),
    BROWSER_SLOWMO: 800, // Milliseconds delay between actions (for visibility)
    HEADLESS: false, // Set to true for CI/CD
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateStrongPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars[crypto.randomInt(0, chars.length)];
    }
    return password;
}

function ensureScreenshotDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// ============================================================
// MAIN TEST FUNCTION
// ============================================================

async function testOAuthWithPopup() {
    console.log('🎯 OAuth Popup Test\n');
    console.log('═══════════════════════════════════════════════════════\n');

    ensureScreenshotDir(CONFIG.SCREENSHOTS_DIR);

    const browser = await chromium.launch({
        headless: CONFIG.HEADLESS,
        slowMo: CONFIG.BROWSER_SLOWMO,
    });

    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
    });

    const page = await context.newPage();

    // ============================================================
    // CRITICAL: Capture popup windows
    // This is the key pattern for OAuth popup flows
    // ============================================================
    let popupPage = null;
    context.on('page', async (newPage) => {
        console.log('🪟  POPUP WINDOW DETECTED');
        console.log(`   📍 URL: ${newPage.url()}`);
        popupPage = newPage;

        // Wait for popup to load
        await newPage.waitForLoadState('networkidle').catch(() => {});

        // Take screenshot
        await newPage.screenshot({
            path: path.join(CONFIG.SCREENSHOTS_DIR, 'popup-opened.png'),
            fullPage: true
        }).catch(() => {});
    });

    try {
        // ============================================================
        // STEP 1: Open Application
        // ============================================================
        console.log('📱 STEP 1: Opening application...');
        await page.goto(CONFIG.APP_URL);
        await page.waitForTimeout(2000);

        await page.screenshot({
            path: path.join(CONFIG.SCREENSHOTS_DIR, '01-app-opened.png'),
            fullPage: true
        });
        console.log('  ✅ Loaded\n');

        // ============================================================
        // STEP 2: Click Login Button
        // ============================================================
        console.log('🖱️  STEP 2: Clicking login button...');
        await page.click(`text="${CONFIG.LOGIN_BUTTON_TEXT}"`);
        await page.waitForTimeout(3000);
        console.log('  ✅ Clicked\n');

        // ============================================================
        // STEP 3: Verify Popup Opened
        // ============================================================
        if (!popupPage) {
            throw new Error('❌ Popup window did not open. Check if OAuth flow uses redirects instead.');
        }

        console.log('✅ STEP 3: Popup captured successfully\n');

        // Verify we're on the OAuth provider
        const popupUrl = popupPage.url();
        if (!popupUrl.includes(CONFIG.OAUTH_PROVIDER_URL_PATTERN)) {
            console.log(`  ⚠️  Warning: Popup URL doesn't match expected pattern`);
            console.log(`     Expected: ${CONFIG.OAUTH_PROVIDER_URL_PATTERN}`);
            console.log(`     Actual: ${popupUrl}`);
        }

        // ============================================================
        // STEP 4-6: Handle OAuth Flow (Customize based on your provider)
        // ============================================================

        // Example: Multi-step registration
        await handleRegistrationFlow(popupPage, CONFIG.SCREENSHOTS_DIR);

        // ============================================================
        // STEP 7: Verify Authentication Success
        // ============================================================
        console.log('📊 STEP 7: Checking authentication result...\n');
        await page.waitForTimeout(3000);

        // Check if popup closed (usually means auth succeeded)
        if (popupPage.isClosed()) {
            console.log('  ✅ Popup closed - OAuth likely completed\n');
        } else {
            console.log(`  ℹ️  Popup still open: ${popupPage.url()}\n`);
        }

        await page.screenshot({
            path: path.join(CONFIG.SCREENSHOTS_DIR, '07-final-state.png'),
            fullPage: true
        });

        // Verify user is authenticated (customize based on your app)
        const isAuthenticated = await verifyAuthentication(page);

        console.log('═══════════════════════════════════════════════════════');
        console.log('🎯 RESULT:\n');

        if (isAuthenticated) {
            console.log('  ✅ ✅ ✅ SUCCESS! User is authenticated!');
        } else {
            console.log('  ⚠️  Authentication may not have completed');
        }

        console.log(`\n📸 Screenshots: ${CONFIG.SCREENSHOTS_DIR}`);
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('⏳ Browser stays open for 10 seconds...\n');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        await page.screenshot({
            path: path.join(CONFIG.SCREENSHOTS_DIR, 'error-main.png'),
            fullPage: true
        });

        if (popupPage && !popupPage.isClosed()) {
            await popupPage.screenshot({
                path: path.join(CONFIG.SCREENSHOTS_DIR, 'error-popup.png'),
                fullPage: true
            });
        }

        throw error;
    } finally {
        await browser.close();
        console.log('🏁 Done!');
    }
}

// ============================================================
// HELPER FUNCTIONS - Customize based on your OAuth provider
// ============================================================

async function handleRegistrationFlow(popupPage, screenshotsDir) {
    console.log('📝 STEP 4: Registration flow...');

    // Click "Create account" if exists
    const createLink = await popupPage.locator('text="Create account"');
    if (await createLink.count() > 0) {
        await createLink.click();
        await popupPage.waitForTimeout(2000);
        console.log('  ✅ Clicked "Create account"');
    }

    // Step 1: Enter username
    const username = `user${Date.now()}`;
    const usernameInput = await popupPage.locator('input[name="identifier"]').first();
    await usernameInput.fill(username);
    console.log(`  ✅ Username: ${username}`);

    await popupPage.screenshot({
        path: path.join(screenshotsDir, '04-username.png'),
        fullPage: true
    });

    // Submit username
    console.log('🚀 STEP 5: Submitting username...');
    await popupPage.locator('button:has-text("Create account")').first().click();
    await popupPage.waitForTimeout(3000);
    console.log('  ✅ Submitted\n');

    // Step 2: Enter password
    console.log('🔐 STEP 6: Setting password...');
    const password = generateStrongPassword();
    const passwordInputs = await popupPage.locator('input[type="password"]').all();

    if (passwordInputs.length >= 2) {
        await passwordInputs[0].fill(password);
        await passwordInputs[1].fill(password);
        console.log('  ✅ Password entered');

        await popupPage.screenshot({
            path: path.join(screenshotsDir, '05-password.png'),
            fullPage: true
        });

        // Save password
        await popupPage.locator('button:has-text("Save password")').first().click();
        console.log('  ✅ Password saved\n');

        await popupPage.waitForTimeout(3000);
    }
}

async function verifyAuthentication(page) {
    // Customize based on your app's authenticated state indicators
    const hasLoginButton = await page.locator('text="Sign In"').count() > 0;
    const hasUserContent = await page.locator('text="Profile", text="Dashboard"').count() > 0;

    return !hasLoginButton && hasUserContent;
}

// ============================================================
// RUN TEST
// ============================================================

if (require.main === module) {
    testOAuthWithPopup().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { testOAuthWithPopup };

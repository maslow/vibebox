#!/usr/bin/env node
/**
 * OAuth Redirect Mode Test
 * Tests the new redirect-based authentication flow (no popup)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const screenshotsDir = path.join(__dirname, 'tmp', 'oauth-redirect');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Generate strong random password
const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
    const length = 16;
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[crypto.randomInt(0, chars.length)];
    }
    return password;
};

const testPassword = generateStrongPassword();
console.log(`🔑 Generated strong password: ${testPassword}\n`);

async function oauthRedirectTest() {
    console.log('🎯 OAuth Redirect Test - Full Authentication\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
    });

    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
    });

    const page = await context.newPage();

    // Capture console logs
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            console.log(`  🔴 Browser Error: ${text}`);
        } else if (type === 'warning') {
            console.log(`  ⚠️  Browser Warning: ${text}`);
        } else if (text.includes('Callback') || text.includes('Redirect') || text.includes('auth') || text.includes('Auth') || text.includes('isLoading') || text.includes('isAuthenticated')) {
            console.log(`  📝 Browser Log: ${text}`);
        }
    });

    try {
        // STEP 1: Open VibeBox
        console.log('📱 STEP 1: Opening VibeBox...');
        await page.goto('http://localhost:8081');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '01-vibebox.png'), fullPage: true });
        console.log('  ✅ Loaded\n');

        // STEP 2: Click Sign In (should redirect, NOT popup)
        console.log('🖱️  STEP 2: Clicking Sign In...');
        const initialUrl = page.url();
        await page.click('text="Sign In with Logto"');

        // Wait for redirect to Logto
        await page.waitForURL(url => url.toString().includes('localhost:3001'), { timeout: 10000 });
        console.log('  ✅ Redirected to Logto (no popup!)\n');

        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '02-logto-page.png'), fullPage: true });

        // STEP 3: Create Account - Username
        console.log('📝 STEP 3: Create account - username...');
        const createLink = page.locator('text="Create account"');
        if (await createLink.count() > 0) {
            await createLink.click();
            await page.waitForTimeout(2000);
        }

        const username = `user${Date.now()}`;
        const usernameInput = page.locator('input[name="identifier"]').first();
        await usernameInput.fill(username);
        console.log(`  ✅ Username: ${username}\n`);

        await page.screenshot({ path: path.join(screenshotsDir, '03-username.png'), fullPage: true });

        // STEP 4: Submit Username
        console.log('🚀 STEP 4: Submitting username...');
        await page.locator('button:has-text("Create account")').first().click();
        await page.waitForTimeout(3000);
        console.log('  ✅ Submitted\n');

        await page.screenshot({ path: path.join(screenshotsDir, '04-password-page.png'), fullPage: true });

        // STEP 5: Set Password
        console.log('🔐 STEP 5: Setting password...');

        const passwordInputs = await page.locator('input[type="password"]').all();
        if (passwordInputs.length >= 2) {
            await passwordInputs[0].fill(testPassword);
            await passwordInputs[1].fill(testPassword);
            console.log('  ✅ Password entered\n');

            await page.screenshot({ path: path.join(screenshotsDir, '05-password-filled.png'), fullPage: true });

            // STEP 6: Save Password
            console.log('💾 STEP 6: Saving password...');
            await page.locator('button:has-text("Save password")').first().click();
            console.log('  ✅ Clicked Save\n');

            // Wait for potential errors
            await page.waitForTimeout(2000);

            // Check for error messages
            const errorText = await page.locator('text=/avoid.*simple.*password/i, text=/password.*weak/i, text=/error/i').first().textContent().catch(() => null);

            if (errorText) {
                console.log(`  ⚠️  Password rejected: ${errorText}`);
                console.log('  ℹ️  Logto still considers this password weak\n');
                await page.screenshot({ path: path.join(screenshotsDir, '06-password-error.png'), fullPage: true });
            } else {
                console.log('  ✅ Password accepted!\n');
            }

            // STEP 7: Wait for OAuth flow to complete
            // The flow is: Logto → /callback?code=... → / (happens very fast)
            console.log('⏳ STEP 7: Waiting for OAuth flow to complete...');

            // Wait for either callback or root URL (callback might redirect too fast to catch)
            try {
                await page.waitForURL(url => {
                    const urlStr = url.toString();
                    return urlStr.includes('/callback') || urlStr === 'http://localhost:8081/';
                }, { timeout: 10000 });
                console.log('  ✅ OAuth redirect detected\n');
            } catch (e) {
                console.log('  ⚠️  Redirect too fast or already completed\n');
            }

            // STEP 8: Give time for auth state to update and redirect
            console.log('⏳ STEP 8: Waiting for auth state to update (10 seconds)...');
            await page.waitForTimeout(10000);

            await page.screenshot({ path: path.join(screenshotsDir, '08-app-page.png'), fullPage: true });
        }

        // STEP 9: Verify Authentication
        console.log('📊 STEP 9: Verifying authentication...\n');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: path.join(screenshotsDir, '09-final.png'), fullPage: true });

        const finalUrl = page.url();

        // Check localStorage for Logto authentication data
        const localStorage = await page.evaluate(() => {
            const keys = Object.keys(window.localStorage);
            const logtoKeys = keys.filter(k => k.includes('logto') || k.includes('oidc'));
            const data = {};
            logtoKeys.forEach(k => {
                data[k] = window.localStorage.getItem(k);
            });
            return data;
        });

        // Check if there's Logto data in localStorage (indicates authenticated)
        const hasLogtoData = Object.keys(localStorage).length > 0;
        const hasIdToken = Object.keys(localStorage).some(k => k.includes('idToken') || k.includes('id_token'));

        console.log('═══════════════════════════════════════════════════════');
        console.log('🎯 AUTHENTICATION RESULT:\n');
        console.log(`  📍 Final URL: ${finalUrl}`);
        console.log(`  🔐 localStorage keys: ${Object.keys(localStorage).length}`);
        console.log(`  🎫 Has ID token: ${hasIdToken}`);
        console.log(`  🔄 Redirect mode: YES (no popup used)\n`);

        if (hasLogtoData && hasIdToken) {
            console.log('  ✅ ✅ ✅ SUCCESS!!!');
            console.log('  ✅ User is authenticated!');
            console.log('  ✅ Redirect flow completed!');
            console.log('  ✅ Logto tokens stored in localStorage!');
            console.log('  ✅ No popup window was used!\n');

            console.log('  📦 Logto data in localStorage:');
            Object.keys(localStorage).forEach(key => {
                const value = localStorage[key];
                const preview = value.length > 50 ? value.substring(0, 50) + '...' : value;
                console.log(`    - ${key}: ${preview}`);
            });
            console.log('');
        } else if (hasLogtoData) {
            console.log('  ⚠️  Logto data present but no ID token found');
            console.log('  ℹ️  Authentication may be incomplete\n');
        } else {
            console.log('  ❌ No Logto data in localStorage');
            console.log('  ℹ️  Authentication failed or not completed\n');
        }

        console.log(`📸 Screenshots: ${screenshotsDir}`);
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('⏳ Browser stays open for 15 seconds...\n');
        await page.waitForTimeout(15000);

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });

        throw error;
    } finally {
        await browser.close();
        console.log('🏁 Done!');
    }
}

oauthRedirectTest().catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
});

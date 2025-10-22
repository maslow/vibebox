#!/usr/bin/env node
/**
 * OAuth Success Test - Strong Password + Error Detection
 * Uses complex random password and detects validation errors
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const screenshotsDir = path.join(__dirname, 'tmp', 'oauth-success');
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

async function oauthSuccessTest() {
    console.log('🎯 OAuth Success Test - Full Authentication\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
    });

    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
    });

    const page = await context.newPage();

    let popupPage = null;
    context.on('page', async (newPage) => {
        console.log('🪟  OAuth popup opened');
        popupPage = newPage;
        await newPage.waitForLoadState('networkidle').catch(() => {});
    });

    try {
        // STEP 1: Open VibeBox
        console.log('📱 STEP 1: Opening VibeBox...');
        await page.goto('http://localhost:8081');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '01-vibebox.png'), fullPage: true });
        console.log('  ✅ Loaded\n');

        // STEP 2: Click Sign In
        console.log('🖱️  STEP 2: Clicking Sign In...');
        await page.click('text="Sign In with Logto"');
        await page.waitForTimeout(3000);
        console.log('  ✅ Clicked\n');

        if (!popupPage) throw new Error('No popup');

        await popupPage.screenshot({ path: path.join(screenshotsDir, '02-popup.png'), fullPage: true });

        // STEP 3: Create Account - Username
        console.log('📝 STEP 3: Create account - username...');
        const createLink = await popupPage.locator('text="Create account"');
        if (await createLink.count() > 0) {
            await createLink.click();
            await popupPage.waitForTimeout(2000);
        }

        const username = `user${Date.now()}`;
        const usernameInput = await popupPage.locator('input[name="identifier"]').first();
        await usernameInput.fill(username);
        console.log(`  ✅ Username: ${username}\n`);

        await popupPage.screenshot({ path: path.join(screenshotsDir, '03-username.png'), fullPage: true });

        // STEP 4: Submit Username
        console.log('🚀 STEP 4: Submitting username...');
        await popupPage.locator('button:has-text("Create account")').first().click();
        await popupPage.waitForTimeout(3000);
        console.log('  ✅ Submitted\n');

        await popupPage.screenshot({ path: path.join(screenshotsDir, '04-password-page.png'), fullPage: true });

        // STEP 5: Set Password
        console.log('🔐 STEP 5: Setting password...');

        const passwordInputs = await popupPage.locator('input[type="password"]').all();
        if (passwordInputs.length >= 2) {
            await passwordInputs[0].fill(testPassword);
            await passwordInputs[1].fill(testPassword);
            console.log('  ✅ Password entered\n');

            await popupPage.screenshot({ path: path.join(screenshotsDir, '05-password-filled.png'), fullPage: true });

            // STEP 6: Save Password
            console.log('💾 STEP 6: Saving password...');
            await popupPage.locator('button:has-text("Save password")').first().click();
            console.log('  ✅ Clicked Save\n');

            // Wait and check for errors
            await popupPage.waitForTimeout(3000);

            // Check for error messages
            const errorText = await popupPage.locator('text=/avoid.*simple.*password/i, text=/password.*weak/i, text=/error/i').first().textContent().catch(() => null);

            if (errorText) {
                console.log(`  ⚠️  Password rejected: ${errorText}`);
                console.log('  ℹ️  Logto still considers this password weak\n');

                await popupPage.screenshot({ path: path.join(screenshotsDir, '06-password-error.png'), fullPage: true });
            } else {
                console.log('  ✅ Password accepted!\n');
            }

            await popupPage.screenshot({ path: path.join(screenshotsDir, '06-after-save.png'), fullPage: true }).catch(() => {});

            // STEP 7: Wait for OAuth completion
            console.log('⏳ STEP 7: Waiting for OAuth to complete...');
            await page.waitForTimeout(5000);

            if (popupPage.isClosed()) {
                console.log('  ✅ ✅ Popup closed - OAuth completed!\n');
            } else {
                console.log(`  ℹ️  Popup still open: ${popupPage.url()}\n`);
                await popupPage.screenshot({ path: path.join(screenshotsDir, '07-popup-open.png'), fullPage: true });
            }
        }

        // STEP 8: Check Main Page
        console.log('📊 STEP 8: Checking authentication result...\n');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: path.join(screenshotsDir, '08-main-final.png'), fullPage: true });

        const mainUrl = page.url();
        const hasLogin = await page.locator('text="Sign In with Logto"').count() > 0;
        const hasApp = await page.locator('text="Happy", text="disconnected"').count() > 0;

        console.log('═══════════════════════════════════════════════════════');
        console.log('🎯 AUTHENTICATION RESULT:\n');
        console.log(`  📍 URL: ${mainUrl}`);
        console.log(`  🔐 Has login button: ${hasLogin}`);
        console.log(`  📱 Has app content: ${hasApp}\n`);

        if (!hasLogin && hasApp) {
            console.log('  ✅ ✅ ✅ SUCCESS!!!');
            console.log('  ✅ User is authenticated!');
            console.log('  ✅ OAuth flow completed!');
            console.log('  ✅ Application is accessible!\n');
        } else if (hasLogin) {
            console.log('  ⚠️  Still on login screen');
            console.log('  ℹ️  Check popup for additional steps\n');
        } else {
            console.log('  ℹ️  Unknown state - review screenshots\n');
        }

        console.log(`📸 Screenshots: ${screenshotsDir}`);
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('⏳ Browser stays open for 15 seconds...\n');
        await page.waitForTimeout(15000);

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        await page.screenshot({ path: path.join(screenshotsDir, 'error-main.png'), fullPage: true });
        if (popupPage && !popupPage.isClosed()) {
            await popupPage.screenshot({ path: path.join(screenshotsDir, 'error-popup.png'), fullPage: true });
        }

        throw error;
    } finally {
        await browser.close();
        console.log('🏁 Done!');
    }
}

oauthSuccessTest().catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
});

# OAuth Popup Window Pattern - Critical Testing Pattern

## 🎯 The Problem

When testing OAuth authentication flows in web applications, a common challenge is that the OAuth provider opens a **popup window** instead of redirecting the main page. Standard test automation will completely miss this popup, making the test appear to "do nothing" after clicking the login button.

## 🔍 How We Discovered This

### Initial Symptoms
```
✅ Login page loads
✅ Login button exists
✅ Button click event fires
❌ Nothing happens (page stays on login screen)
❌ No errors in console
❌ No network requests visible
```

### The Breakthrough Moment

**User Observation:** "还弹出了一个小页面" (A small page popped up)

This single observation revealed the issue: **The OAuth flow was working, but opening in a popup window that our test wasn't capturing.**

## ✅ The Solution

### Code Pattern

```javascript
const { chromium } = require('playwright');

async function testOAuth() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // ============================================================
    // CRITICAL: Listen for new pages (popups)
    // ============================================================
    let popupPage = null;
    context.on('page', async (newPage) => {
        console.log('🪟 Popup detected:', newPage.url());
        popupPage = newPage;
        await newPage.waitForLoadState('networkidle');
    });

    // Click login button
    await page.click('text="Sign In"');
    await page.waitForTimeout(3000);

    // Now you can interact with the popup
    if (popupPage) {
        await popupPage.fill('input[name="username"]', 'testuser');
        await popupPage.fill('input[type="password"]', 'password');
        await popupPage.click('button[type="submit"]');
    }
}
```

### Key Points

1. **`context.on('page')`**: Listens for ANY new page/window opened in the context
2. **Popup is a separate `Page` object**: You can't interact with it through the main page
3. **Wait for load**: Popup content may not be immediately available
4. **Check if popup exists**: Not all OAuth flows use popups

## 🚨 Common Mistakes

### ❌ Wrong: Assuming redirect in main page
```javascript
await page.click('text="Sign In"');
await page.waitForNavigation(); // ❌ Won't work if popup opens
```

### ❌ Wrong: Not capturing popup
```javascript
await page.click('text="Sign In"');
await page.waitForTimeout(5000);
// ❌ Popup exists but you can't interact with it
```

### ✅ Right: Capture popup before interaction
```javascript
let popupPage = null;
context.on('page', async (newPage) => {
    popupPage = newPage;
});

await page.click('text="Sign In"');
await page.waitForTimeout(2000);

if (popupPage) {
    // ✅ Now you can interact with it
}
```

## 🎓 When This Pattern Applies

This pattern is essential when testing:

1. **OAuth 2.0 Authentication**
   - Social login (Google, Facebook, GitHub, etc.)
   - Enterprise SSO (Okta, Auth0, Logto, etc.)
   - Any OAuth provider that uses popups

2. **Payment Flows**
   - 3D Secure authentication
   - PayPal login
   - Stripe payment dialogs

3. **Third-Party Integrations**
   - File pickers (Google Drive, Dropbox)
   - Social sharing dialogs
   - External authorization flows

## 🔄 Complete Example: Logto OAuth

```javascript
const { chromium } = require('playwright');

async function testLogtoOAuth() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    let popupPage = null;
    context.on('page', async (newPage) => {
        console.log('🪟 OAuth popup:', newPage.url());
        popupPage = newPage;
        await newPage.waitForLoadState('networkidle');

        // Take screenshot for debugging
        await newPage.screenshot({
            path: 'popup.png',
            fullPage: true
        });
    });

    // Open app and click login
    await page.goto('http://localhost:8081');
    await page.click('text="Sign In with Logto"');
    await page.waitForTimeout(3000);

    if (!popupPage) {
        throw new Error('Popup did not open!');
    }

    // Handle Logto registration flow
    await popupPage.click('text="Create account"');
    await popupPage.fill('input[name="identifier"]', 'testuser');
    await popupPage.click('button:has-text("Create account")');
    await popupPage.waitForTimeout(2000);

    await popupPage.fill('input[type="password"]', 'StrongPass123!@#');
    await popupPage.click('button:has-text("Save password")');

    // Wait for popup to close (auth completed)
    await page.waitForTimeout(5000);

    if (popupPage.isClosed()) {
        console.log('✅ OAuth completed!');
    }

    await browser.close();
}
```

## 📊 Debugging Tips

### 1. Check if popup actually opens
```javascript
let popupCount = 0;
context.on('page', () => {
    popupCount++;
    console.log(`Popup ${popupCount} opened`);
});
```

### 2. Log all popup URLs
```javascript
context.on('page', (newPage) => {
    console.log('New page:', newPage.url());
    newPage.on('framenavigated', frame => {
        if (frame === newPage.mainFrame()) {
            console.log('Popup navigated to:', frame.url());
        }
    });
});
```

### 3. Take screenshots of every popup
```javascript
let popupCounter = 0;
context.on('page', async (newPage) => {
    popupCounter++;
    await newPage.screenshot({
        path: `popup-${popupCounter}.png`,
        fullPage: true
    });
});
```

## 🎯 Success Criteria

Your test successfully handles popups when:

✅ Popup is detected immediately after triggering action
✅ You can interact with popup elements
✅ Screenshots show popup content
✅ Test waits for popup to close (auth completion)
✅ Main page reflects authenticated state after popup closes

## 🔗 Related Patterns

- **Multiple Popups**: Some flows open multiple popups sequentially
- **Popup-to-Redirect**: Popup may redirect main page after completion
- **Conditional Popups**: Some providers use popups OR redirects based on context

## 📚 Resources

- [Playwright Multi-Page Documentation](https://playwright.dev/docs/pages)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [Testing Best Practices](./testing-best-practices.md)

---

**Key Takeaway:** Always listen for `context.on('page')` when testing OAuth flows. This single pattern solves 90% of OAuth testing challenges.

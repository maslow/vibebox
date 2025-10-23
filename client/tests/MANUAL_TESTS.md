# Manual Tests (Technical Limitations)

**Philosophy**: AI First - Manual testing only when technically impossible to automate.

**Review Frequency**: Quarterly - actively seek automation solutions for all items below.

---

## ⚠️ Tests Requiring Manual Execution

### 1. iOS OAuth WebView Interaction

**Test**: Complete OAuth authentication flow in mobile app

**Why Manual**:
- iOS security sandbox prevents test automation from accessing SFSafariViewController DOM
- XCUITest, Maestro, Appium, Detox all have same limitation
- Apple does not expose WebView content to accessibility APIs for security reasons

**Automated Parts**:
- ✅ App launch → Sign In button tap (Maestro)
- ✅ OAuth WebView opening (Maestro)
- ✅ Post-OAuth callback handling (should be automated - see TODO)

**Manual Steps**:
1. Run Maestro test: `maestro test maestro/oauth-flow-verification.yaml`
2. When OAuth WebView opens, manually:
   - [ ] Verify Logto page loads correctly
   - [ ] Click "Create account" link
   - [ ] Enter username: `testuser_[timestamp]`
   - [ ] Enter password: `TestPassword123!@#`
   - [ ] Submit form
   - [ ] Verify OAuth callback returns to app
   - [ ] Verify user is logged in

**Screenshots to Verify**:
- `maestro/screenshots/05-oauth-browser-opened.png` - WebView should show Logto page

**Explored Alternatives**:
- [x] Maestro - Cannot access WebView DOM (confirmed 2025-10-23)
- [x] Appium - Same limitation
- [x] Detox - Same limitation
- [x] XCUITest native - Same limitation
- [ ] In-app WebView instead of SFSafariViewController - Would reduce security
- [ ] Mock OAuth flow - Would not test real integration

**Next Review**: 2025-Q2 (April 2025)

**Potential Future Solutions**:
- Monitor for iOS API changes allowing WebView testing
- Check for new testing tools that bypass this limitation
- Consider TestFlight + cloud device farm for automated visual testing
- Explore OCR-based testing (Applitools, Percy) as fallback

---

## 📋 Manual Test Checklist (Pre-Release)

Run before each release:

### OAuth Flow
- [ ] iOS: Complete manual OAuth test (see above)
- [ ] Android: Complete manual OAuth test (when Android support added)

### (Other manual tests - should be empty if we succeed in AI First approach)

---

## 🎯 Automation Goals

**Current Status**: 1 manual test (OAuth WebView - technical limitation)

**Target**: 0 manual tests (if technically possible)

**Progress Tracking**:
- 2025-10: Initial - 1 manual test
- 2025-Q2: Review and reassess
- 2025-Q3: Review and reassess
- 2025-Q4: Review and reassess

---

## 📝 Adding New Manual Tests

**Before adding a new manual test**, you MUST:

1. Document why automation is impossible (not just "hard")
2. List all automation tools/approaches tried
3. Set a review date (within 3 months)
4. Get team approval (this should be rare)

**Template**:

```markdown
### [Test Name]

**Why Manual**: [Specific technical limitation]

**Automated Parts**: [What IS automated]

**Manual Steps**: [Minimal manual steps needed]

**Explored Alternatives**:
- [ ] Tool 1 - [Why it doesn't work]
- [ ] Tool 2 - [Why it doesn't work]

**Next Review**: [Date within 3 months]
```

---

**Remember**: Manual tests are technical debt. Treat them like bugs - fix when possible.

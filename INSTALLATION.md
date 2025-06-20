# Installation Guide for macOS

## 🚨 "App is damaged" Error Solution

If you see a message saying "Deep Journal is damaged and can't be opened", this is a common macOS security feature (Gatekeeper) blocking unsigned applications. Here are several ways to resolve this:

### Method 1: Remove Quarantine Attribute (Recommended)
1. **Download the DMG file** from GitHub releases
2. **Open Terminal** (Applications → Utilities → Terminal)
3. **Navigate to your Downloads folder:**
   ```bash
   cd ~/Downloads
   ```
4. **Remove the quarantine attribute:**
   ```bash
   xattr -d com.apple.quarantine "Deep Journal-1.2.2-arm64.dmg"
   ```
   (Replace with the exact filename you downloaded)
5. **Double-click the DMG** to open it normally

### Method 2: System Preferences Override
1. **Try to open the DMG** (you'll get the security warning)
2. **Open System Preferences** → **Security & Privacy** → **General**
3. **Look for a message** about Deep Journal being blocked
4. **Click "Open Anyway"** next to the message
5. **Confirm** when prompted with another dialog

### Method 3: Right-Click Override
1. **Control+Click** (or right-click) on the DMG file
2. **Select "Open"** from the context menu
3. **Click "Open"** in the security warning dialog
4. **The DMG should now open** normally

### Method 4: Disable Gatekeeper Temporarily (Advanced)
⚠️ **Use with caution - this reduces your Mac's security**
```bash
# Disable Gatekeeper temporarily
sudo spctl --master-disable

# After installing Deep Journal, re-enable it
sudo spctl --master-enable
```

## 📋 Which File to Download?

- **Apple Silicon Macs (M1, M2, M3)**: Download `Deep Journal-1.2.2-arm64.dmg`
- **Intel Macs**: Download `Deep Journal-1.2.2.dmg`
- **Not sure?**: Click Apple menu → About This Mac. If you see "Apple M1/M2/M3", use ARM64 version.

## 🔒 Why This Happens

This security warning appears because:
- Deep Journal is not code-signed with an Apple Developer certificate ($99/year)
- macOS protects users from potentially malicious software
- Open-source applications often face this limitation

## ✅ Is It Safe?

Yes! Deep Journal is:
- ✅ **Open source** - all code is publicly available on GitHub
- ✅ **No telemetry** - your data stays on your device
- ✅ **Community verified** - transparent development process
- ✅ **Regular updates** - active maintenance and security fixes

## 🆘 Still Having Issues?

If none of these methods work:
1. **Check your macOS version** - ensure you're running a supported version
2. **Try the ZIP version** instead of DMG
3. **Open an issue** on GitHub with your macOS version and exact error message

## 🔄 Auto-Updates

Once installed, Deep Journal includes an auto-update system that will notify you of new versions and handle updates seamlessly.

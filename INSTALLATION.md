# Installation Guide

## 🚨 Security Warnings Solutions

### macOS: "App is damaged" Error

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

### Windows: "Isn't commonly downloaded" Warning

If you see a message saying "Deep Journal isn't commonly downloaded. Make sure you trust it before opening", this is Windows Defender SmartScreen protecting you from unsigned software.

#### Method 1: SmartScreen Override (Recommended)
1. **Click "Keep"** when the download warning appears in your browser
2. **Navigate to the downloaded file** in File Explorer
3. **Right-click the .exe file** → **Properties**
4. **Check "Unblock"** at the bottom → **Apply** → **OK**
5. **Double-click to run** the installer normally

#### Method 2: Run Anyway
1. **Try to run the .exe** (you'll get the SmartScreen warning)
2. **Click "More info"** in the warning dialog
3. **Click "Run anyway"** at the bottom
4. **Confirm** when prompted with User Account Control

#### Method 3: Disable SmartScreen Temporarily (Advanced)
⚠️ **Use with caution - this reduces your PC's security**
1. **Open Windows Security** → **App & browser control**
2. **Click "Reputation-based protection settings"**
3. **Turn off "Check apps and files"** temporarily
4. **Install Deep Journal**
5. **Turn protection back on**

#### Method 4: Windows Defender Exception
1. **Open Windows Security** → **Virus & threat protection**
2. **Click "Manage settings"** under Virus & threat protection settings
3. **Scroll down** to **"Add or remove exclusions"**
4. **Add the Deep Journal .exe file** as an exclusion

## 📋 Which File to Download?

### macOS
- **Apple Silicon Macs (M1, M2, M3)**: Download `Deep Journal-1.2.3-arm64.dmg`
- **Intel Macs**: Download `Deep Journal-1.2.3.dmg`
- **Not sure?**: Click Apple menu → About This Mac. If you see "Apple M1/M2/M3", use ARM64 version.

### Windows
- **Most users**: Download `Deep Journal Setup 1.2.3.exe` (installer)
- **Portable version**: Download `Deep Journal 1.2.3.exe` (no installation required)
- **System requirements**: Windows 10 or later (both 32-bit and 64-bit supported)

## 🔒 Why This Happens

### macOS Security Warning
This security warning appears because:
- Deep Journal is not code-signed with an Apple Developer certificate ($99/year)
- macOS protects users from potentially malicious software
- Open-source applications often face this limitation

### Windows Security Warning
This security warning appears because:
- Deep Journal is not code-signed with a Windows code signing certificate ($200+/year)
- Windows SmartScreen protects users from unrecognized software
- New releases need time to build "reputation" in Microsoft's systems
- Open-source applications often face this limitation

## ✅ Is It Safe?

Yes! Deep Journal is:
- ✅ **Open source** - all code is publicly available on GitHub
- ✅ **No telemetry** - your data stays on your device
- ✅ **Community verified** - transparent development process
- ✅ **Regular updates** - active maintenance and security fixes
- ✅ **Local-first** - no data sent to external servers
- ✅ **Virus scanned** - all releases are scanned by GitHub's security systems

## 🆘 Still Having Issues?

### macOS
If none of the macOS methods work:
1. **Check your macOS version** - ensure you're running a supported version (10.15+)
2. **Try the ZIP version** instead of DMG
3. **Open an issue** on GitHub with your macOS version and exact error message

### Windows
If none of the Windows methods work:
1. **Check your Windows version** - ensure you're running Windows 10 or later
2. **Try the portable version** instead of the installer
3. **Temporarily disable antivirus** (some third-party antivirus may block it)
4. **Open an issue** on GitHub with your Windows version and exact error message

## 🔄 Auto-Updates

Once installed, Deep Journal includes an auto-update system that will notify you of new versions and handle updates seamlessly.

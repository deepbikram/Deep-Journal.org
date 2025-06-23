# Code Signing Setup Guide

## 🔑 Complete Solution: Eliminate Security Warnings

To completely eliminate security warnings for users, you need to implement **code signing** for both platforms. This is the only way to make the warnings disappear automatically.

## 🍎 **macOS Code Signing Setup**

### Prerequisites
1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate**
3. **App-specific password** for notarization

### Steps:

#### 1. Get Apple Developer Certificates
```bash
# Install Xcode command line tools
xcode-select --install

# Open Keychain Access and request Developer ID Application certificate
# OR download from Apple Developer Portal
```

#### 2. Update Environment Variables
Create `.env` file in project root:
```env
# macOS Code Signing
APPLE_ID=your-apple-id@example.com
APPLE_APP_SPECIFIC_PASSWORD=your-app-specific-password
APPLE_TEAM_ID=your-team-id
CSC_IDENTITY_AUTO_DISCOVERY=true
```

#### 3. Update package.json (Already Done)
The macOS configuration is already updated with:
- `identity`: Set to your Developer ID
- `notarize`: Configured for automatic notarization

#### 4. Build with Code Signing
```bash
# Export environment variables
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="your-team-id"

# Build and sign
npm run package
```

## 🪟 **Windows Code Signing Setup**

### Prerequisites
1. **Code Signing Certificate** ($200-400/year)
   - DigiCert, Sectigo, Comodo, or others
   - EV Code Signing Certificate (recommended for immediate trust)
2. **Certificate file** (.p12 or .pfx format)

### Steps:

#### 1. Purchase Code Signing Certificate
**Recommended Providers:**
- **DigiCert** (most trusted)
- **Sectigo** (good value)
- **Comodo** (budget option)

**Certificate Types:**
- **EV Code Signing** ($300-400/year) - Immediate SmartScreen trust
- **Standard Code Signing** ($200-300/year) - Requires reputation building

#### 2. Setup Certificate
```bash
# Create certs directory
mkdir certs

# Place your certificate file in certs/windows-certificate.p12
# Set password in environment variable
export CSC_KEY_PASSWORD="your-certificate-password"
```

#### 3. Update Environment Variables
Add to `.env`:
```env
# Windows Code Signing
CSC_LINK=certs/windows-certificate.p12
CSC_KEY_PASSWORD=your-certificate-password
WIN_CSC_LINK=certs/windows-certificate.p12
WIN_CSC_KEY_PASSWORD=your-certificate-password
```

#### 4. Update package.json (Already Done)
The Windows configuration is already updated with:
- `certificateFile`: Points to certificate file
- `signingHashAlgorithms`: Uses SHA256
- `signAndEditExecutable`: Signs main executable
- `signDlls`: Signs all DLL files

#### 5. Build with Code Signing
```bash
# Export environment variables
export CSC_KEY_PASSWORD="your-certificate-password"

# Build and sign
npm run package
```

## 🚀 **Automated CI/CD Code Signing**

### GitHub Actions Setup

Create `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build and Release (macOS)
        if: matrix.os == 'macos-latest'
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          CSC_IDENTITY_AUTO_DISCOVERY: true
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run release

      - name: Build and Release (Windows)
        if: matrix.os == 'windows-latest'
        env:
          CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run release
```

### Required GitHub Secrets:
- `APPLE_ID`: Your Apple ID
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Your Apple Developer Team ID
- `WIN_CSC_KEY_PASSWORD`: Windows certificate password

## 💰 **Cost Breakdown**

### Annual Costs:
- **Apple Developer Program**: $99/year
- **Windows Code Signing Certificate**: $200-400/year
- **Total**: $299-499/year

### One-time Setup:
- **Certificate setup**: 2-4 hours
- **CI/CD configuration**: 1-2 hours
- **Testing and verification**: 1-2 hours

## 🎯 **Expected Results**

After implementing code signing:

### macOS:
- ✅ **No "damaged app" warnings**
- ✅ **Gatekeeper allows execution**
- ✅ **Users can double-click to install**
- ✅ **Notarized apps show developer info**

### Windows:
- ✅ **No SmartScreen warnings**
- ✅ **Windows Defender allows execution**
- ✅ **Users can double-click to install**
- ✅ **Certificate info shown in Properties**

## 🔄 **Alternative: Interim Solutions**

If code signing isn't feasible immediately:

### 1. Installer Scripts
Create PowerShell script for Windows users:
```powershell
# install.ps1
Write-Host "Installing Deep Journal..."
Unblock-File "Deep Journal Setup 1.2.3.exe"
Start-Process "Deep Journal Setup 1.2.3.exe" -Wait
```

### 2. Browser Extensions
Some browsers can whitelist known safe downloads

### 3. Documentation
Comprehensive user guides (already implemented)

## 📝 **Implementation Priority**

1. **High Priority**: Windows EV Code Signing (immediate trust)
2. **Medium Priority**: Apple Developer Program + notarization
3. **Low Priority**: Automated CI/CD pipeline

The investment in code signing will eliminate 95% of user friction and support requests related to security warnings.

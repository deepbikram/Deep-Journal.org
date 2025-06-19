# Auto-Update Setup for Deep Journal

## Overview

This document explains how to set up and use the auto-update mechanism for Deep Journal using electron-updater and GitHub Releases.

## Features

- **Automatic Update Checks**: The app checks for updates on startup
- **Manual Update Checks**: Users can manually check for updates via the Settings dialog
- **Progress Tracking**: Real-time download progress indicators
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Secure**: No GitHub tokens embedded in the client
- **User-Friendly**: Clear notifications and one-click restart to install

## Setup Instructions

### 1. GitHub Repository Configuration

Make sure your repository is public and matches the configuration in `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "deepbikram",
      "repo": "deep-journal.org",
      "releaseType": "release"
    }
  }
}
```

### 2. GitHub Token Setup

For publishing releases, you'll need a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with these permissions:
   - `repo` (Full control of private repositories)
   - `write:packages` (Upload packages to GitHub Package Registry)
3. Set the token as an environment variable:

```bash
export GH_TOKEN="your_github_token_here"
```

Or create a `.env` file (never commit this):
```
GH_TOKEN=your_github_token_here
```

### 3. Build and Publish Commands

#### Development Build (Local Testing)
```bash
pnpm run build
pnpm run package
```

#### Release Build (Publishes to GitHub)
```bash
# Make sure GH_TOKEN is set in your environment
export GH_TOKEN="your_github_token_here"

# Build and publish
pnpm run release
```

#### Manual Publish (Alternative method)
```bash
# Build without publishing
pnpm run build

# Publish to GitHub Releases
npx electron-builder build --publish always
```

## Release Assets Created

When you publish a release, the following assets are automatically created:

### macOS
- `Deep-Journal-1.0.0.dmg` - Installer for macOS
- `Deep-Journal-1.0.0-mac.zip` - Zipped app bundle
- `latest-mac.yml` - Update metadata for macOS

### Windows
- `Deep-Journal-Setup-1.0.0.exe` - NSIS installer
- `Deep-Journal-1.0.0-win.exe` - Portable executable
- `latest.yml` - Update metadata for Windows

### Linux
- `Deep-Journal-1.0.0.AppImage` - AppImage package
- `Deep-Journal-1.0.0.deb` - Debian package
- `latest-linux.yml` - Update metadata for Linux

## Version Management

1. Update version in `package.json`
2. Commit changes
3. Create a git tag: `git tag v1.0.1`
4. Push tag: `git push origin v1.0.1`
5. Run the release command

## How Auto-Updates Work

### For Users
1. **Automatic**: App checks for updates on startup
2. **Manual**: Click "Check for Updates" in Settings
3. **Download**: Update downloads automatically in background
4. **Install**: Click "Restart to Update" when ready

### For Developers
1. **Publish**: Release new version to GitHub
2. **Detection**: electron-updater checks GitHub Releases API
3. **Download**: Users download update automatically
4. **Install**: Update applied on app restart

## Troubleshooting

### Update Check Fails
- Ensure repository is public
- Check internet connection
- Verify GitHub repository exists
- Check console for error messages

### Build/Publish Fails
- Verify GH_TOKEN is set correctly
- Ensure token has correct permissions
- Check repository name in package.json
- Verify you have push access to the repository

### Updates Not Detected
- Check that latest.yml files are present in release
- Verify app version is lower than release version
- Ensure app is packaged (updates only work in production builds)

## Security Notes

- GitHub tokens are only used during build/publish process
- No sensitive credentials are embedded in the client
- Updates are served directly from GitHub's CDN
- All downloads are verified by electron-updater

## Cross-Platform Considerations

### Windows
- NSIS installer supports silent updates
- Portable version available for users who can't install

### macOS
- Code signing required for distribution
- Notarization recommended for Gatekeeper
- Universal builds support both Intel and Apple Silicon

### Linux
- AppImage works on most distributions
- Debian package for Ubuntu/Debian systems
- No automatic updates by default (manual download)

## Example Release Workflow

1. **Development**:
   ```bash
   # Make changes
   git add .
   git commit -m "New feature: XYZ"
   ```

2. **Version Bump**:
   ```bash
   # Update version in package.json to 1.0.1
   git add package.json
   git commit -m "Bump version to 1.0.1"
   ```

3. **Tag and Release**:
   ```bash
   git tag v1.0.1
   git push origin main
   git push origin v1.0.1
   
   # Set GitHub token
   export GH_TOKEN="your_token_here"
   
   # Build and publish
   pnpm run release
   ```

4. **Verify**:
   - Check GitHub Releases page
   - Verify all assets are uploaded
   - Test update mechanism in development

That's it! Your auto-update system is now configured and ready to use.

# QR Code Import System Installation Guide

## 📦 Required Dependencies

To implement the QR code scanning functionality, you need to install the following package:

```bash
# Install expo-barcode-scanner for QR code scanning
npx expo install expo-barcode-scanner

# If you want to enable clipboard functionality for testing
npx expo install expo-clipboard
```

## 🔧 Configuration Required

### 1. **app.json/app.config.js Configuration**

Add camera permissions to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-barcode-scanner",
        {
          "cameraPermission": "Allow access to camera to scan QR codes for importing training configurations."
        }
      ]
    ]
  }
}
```

### 2. **Android Permissions** (if using bare React Native)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### 3. **iOS Permissions** (if using bare React Native)

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to scan QR codes for importing training configurations.</string>
```

## 🚀 Installation Commands

Run these commands in your project root:

```bash
# Navigate to your project directory
cd /path/to/your/flexipad/project

# Install the required package
npx expo install expo-barcode-scanner

# Optional: Install clipboard support
npx expo install expo-clipboard

# Rebuild the project
npx expo run:android
# or
npx expo run:ios
```

## 📱 Testing the QR System

### Generate Test QR Code

1. Copy the example JSON from the "View Example QR Data" button
2. Use any QR code generator (online tools like qr-code-generator.com)
3. Paste the JSON and generate a QR code
4. Test scanning with the app

### Example QR JSON Structure

```json
{
  "version": "1.0.0",
  "type": "hit_mode_config",
  "metadata": {
    "name": "Quick Training",
    "description": "Fast reaction training",
    "created_at": "2024-01-01T00:00:00.000Z",
    "created_by": "Coach"
  },
  "configuration": {
    "lightOut": {
      "mode": "Hit",
      "hitCount": 5
    },
    "lightDelay": {
      "mode": "Fixed",
      "delayTime": 0.5
    },
    "duration": {
      "mode": "Hit",
      "hitCount": 10
    }
  }
}
```

## 🔍 Troubleshooting

### Camera Permission Issues
- Make sure camera permissions are granted in device settings
- Restart the app after granting permissions
- Check that the camera is not being used by another app

### QR Code Not Scanning
- Ensure good lighting conditions
- Keep the QR code within the scanning frame
- Make sure the QR code contains valid JSON

### Import Errors
- Verify the QR code contains valid JSON structure
- Check that all required fields are present
- Review validation error messages for specific issues

## 📊 Features Implemented

✅ **QR Code Scanning**
- Camera-based QR code detection
- Real-time scanning with visual feedback
- Permission handling

✅ **Configuration Validation**
- Comprehensive JSON structure validation
- Field-specific error reporting
- Warning system for non-critical issues

✅ **Import Preview**
- Visual preview of configuration before import
- Detailed breakdown of all settings
- Confirmation/rejection workflow

✅ **Seamless Integration**
- Automatic population of manual setup fields
- Tab switching after import
- Success/error feedback

## 🔄 Workflow Summary

1. **Scan QR**: User taps "Scan QR Code" button
2. **Camera Opens**: Permission requested, camera activates
3. **QR Detected**: JSON extracted from QR code
4. **Validation**: Configuration validated against schema
5. **Preview**: User sees configuration details
6. **Import**: User confirms, settings applied to form
7. **Switch Tab**: Automatically shows manual setup with imported values

The system is now ready for production use! 🎉
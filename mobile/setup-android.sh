#!/bin/bash

# Setup script for Android development

echo "🔧 Setting up Android development environment..."

# Create android directory if it doesn't exist
mkdir -p android

# Set up local.properties
echo "📱 Creating local.properties..."
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties

# Check if ANDROID_HOME is set
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME not set. Adding to ~/.zshrc..."
    echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
    echo "✅ Environment variables added to ~/.zshrc"
    echo "🔄 Please restart your terminal or run: source ~/.zshrc"
else
    echo "✅ ANDROID_HOME is set: $ANDROID_HOME"
fi

# Check if adb is available
if command -v adb &> /dev/null; then
    echo "✅ ADB is available"
    echo "📱 Connected devices:"
    adb devices
else
    echo "❌ ADB not found. Please install Android Studio or platform-tools"
fi

echo "🎉 Setup complete!"
echo "🚀 You can now run: npx expo run:android --device" 
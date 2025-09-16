# AudioApp

A simple React Native app for recording, pausing, resuming, stopping, and playing audio files.  
Supports Android and iOS (with platform limitations).

## Features

- Start, pause, resume, and stop audio recording
- Save recordings and display them in a list
- Play, pause, and stop playback of recorded audio
- Handles microphone permissions
- Shows recording status and playback status

## Requirements

- Node.js & npm
- React Native CLI
- Android Studio (for Android) or Xcode (for iOS)
- Device/emulator with microphone access

## Installation

1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd AudioApp
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Install pods for iOS (Mac only):
   ```sh
   npx pod-install
   ```

## Running the App

### Android
```sh
npm run android
```

### iOS
```sh
npx react-native run-ios
```

## Usage

- Tap **Start** to begin recording.
- Tap **Pause** to pause recording.
- Tap **Resume** to continue recording.
- Tap **Stop** to finish and save the recording.
- Tap a recording in the list to play or pause playback.

## Permissions

- The app requests microphone permission on Android.
- For iOS, ensure you add the following to your `Info.plist`:
  ```xml
  <key>NSMicrophoneUsageDescription</key>
  <string>This app needs access to your microphone to record audio.</string>
  ```

## Notes

- Background recording is supported only while the app is running (not terminated).
- Audio playback in the background may require additional configuration on iOS (enable "Background Modes" > "Audio" in Xcode).
- No audio data is lost unless the app is killed/terminated by the OS.

## License

MIT

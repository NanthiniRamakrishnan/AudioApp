import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  AppState,
  StatusBar,
  StyleSheet,
  AppStateStatus,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AudioRecorderPlayer from 'react-native-nitro-sound';
import Ionicons from 'react-native-vector-icons/Ionicons';

const recorderInstance = AudioRecorderPlayer;

export default function VoiceRecorderApp() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPausedRec, setIsPausedRec] = useState(false);
  const [savedAudios, setSavedAudios] = useState<string[]>([]);
  const [currentPlaying, setCurrentPlaying] = useState<string | null | undefined>(null);
  const [wasPaused, setWasPaused] = useState(false);
  const appStatus = useRef<AppStateStatus>(AppState.currentState);

  // ✅ Ask permission
  async function askMicPermission() {
    if (Platform.OS !== 'android') return true;
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app requires microphone access to record audio',
          buttonPositive: 'Allow',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }

  // ✅ Handle app state (pause/resume on background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (next: AppStateStatus) => {
      if (appStatus.current === 'active' && next.match(/inactive|background/)) {
        if (isRecording && !isPausedRec) {
          await recorderInstance.pauseRecorder();
          setWasPaused(true);
          setIsPausedRec(true);
        }
      } else if (appStatus.current.match(/inactive|background/) && next === 'active') {
        if (wasPaused) {
          await recorderInstance.resumeRecorder();
          setWasPaused(false);
        }
      }
      appStatus.current = next;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [wasPaused]);

  // ✅ Start recording
  const startRecording = async () => {
    const permission = await askMicPermission();
    if (!permission) {
      Alert.alert('Permission Denied', 'Microphone access is required.');
      return;
    }
    try {
      await recorderInstance.startRecorder();
      setIsRecording(true);
      setIsPausedRec(false);
    } catch (err) {
      console.error('Error while starting:', err);
    }
  };

  // ✅ Pause recording
  const pauseRecording = async () => {
    try {
      await recorderInstance.pauseRecorder();
      setIsPausedRec(true);
    } catch (err) {
      console.error('Error while pausing:', err);
    }
  };

  // ✅ Resume recording
  const resumeRecording = async () => {
    try {
      await recorderInstance.resumeRecorder();
      setIsPausedRec(false);
    } catch (err) {
      console.error('Error while resuming:', err);
    }
  };

  // ✅ Stop recording
  const stopRecording = async () => {
    try {
      const filePath = await recorderInstance.stopRecorder();
      setIsRecording(false);
      setIsPausedRec(false);
      if (filePath) {
        setSavedAudios((prev) => [...prev, filePath]);
      }
    } catch (err) {
      console.error('Error while stopping:', err);
    }
  };

  // ✅ Play audio
  const playAudioFile = async (filePath: string | undefined) => {
    try {
      if (currentPlaying === filePath) {
        await recorderInstance.stopPlayer();
        recorderInstance.removePlayBackListener();
        setCurrentPlaying(null);
        return;
      }
      if (currentPlaying) {
        await recorderInstance.stopPlayer();
        recorderInstance.removePlayBackListener();
      }
      await recorderInstance.startPlayer(filePath);
      await recorderInstance.setVolume(1.0);
      setCurrentPlaying(filePath);

      recorderInstance.addPlayBackListener((e) => {
        if (e.currentPosition >= e.duration) {
          recorderInstance.stopPlayer();
          recorderInstance.removePlayBackListener();
          setCurrentPlaying(null);
        }
      });
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ height: StatusBar.currentHeight, backgroundColor: '#0066cc' }}>
        <StatusBar barStyle="light-content" />
      </View>

      {/* ✅ Recorded Audios on Top */}
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={styles.sectionTitle}>Your Recordings</Text>
        <FlatList
          data={savedAudios}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.listItem, currentPlaying === item && { borderColor: '#28a745' }]}
              onPress={() => playAudioFile(item)}
            >
              <Ionicons
                name={currentPlaying === item ? 'volume-high' : 'musical-notes'}
                size={22}
                color={currentPlaying === item ? '#28a745' : '#444'}
              />
              <Text
                style={[
                  styles.fileText,
                  currentPlaying === item && { color: '#28a745', fontWeight: 'bold' },
                ]}
              >
                {item.split('/').pop() || 'Unnamed Clip'}
              </Text>
              <Ionicons
                name={currentPlaying === item ? 'pause-circle' : 'play-circle'}
                size={28}
                color={currentPlaying === item ? '#28a745' : '#666'}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#777' }}>No recordings yet.</Text>
            </View>
          )}
        />
      </View>

      {/* ✅ Controls at Bottom */}
      <View style={styles.controlPanel}>
        <Text style={styles.statusText}>
          Status: {isRecording ? (isPausedRec ? 'Paused' : 'Recording...') : 'Idle'}
        </Text>
        <View style={styles.buttonRow}>
          {!isRecording && (
            <TouchableOpacity style={styles.controlBtn} onPress={startRecording}>
              <MaterialIcons name="fiber-manual-record" size={28} color="white" />
              <Text style={styles.controlLabel}>Start</Text>
            </TouchableOpacity>
          )}
          {isRecording && !isPausedRec && (
            <>
              <TouchableOpacity style={styles.controlBtn} onPress={pauseRecording}>
                <MaterialIcons name="pause" size={28} color="white" />
                <Text style={styles.controlLabel}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={stopRecording}>
                <MaterialIcons name="stop" size={28} color="white" />
                <Text style={styles.controlLabel}>Stop</Text>
              </TouchableOpacity>
            </>
          )}
          {isRecording && isPausedRec && (
            <>
              <TouchableOpacity style={styles.controlBtn} onPress={resumeRecording}>
                <MaterialIcons name="play-arrow" size={28} color="white" />
                <Text style={styles.controlLabel}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={stopRecording}>
                <MaterialIcons name="stop" size={28} color="white" />
                <Text style={styles.controlLabel}>Stop</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
  },

  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef6ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  audioText: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
    color: '#333',
  },

  controlPanel: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#0066cc',
  },
  statusText: {
    textAlign: 'center',
    color: 'white',
    marginBottom: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlBtn: {
    backgroundColor: '#004c99',
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlLabel: {
    color: 'white',
    fontSize: 15,
    marginLeft: 6,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1,
  },
  fileText: { marginLeft: 10, flex: 1, fontSize: 15, color: '#444' },
});
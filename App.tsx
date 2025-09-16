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
  StyleSheet, AppStateStatus,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AudioRecorderPlayer from 'react-native-nitro-sound';

const audioRecorderPlayer = AudioRecorderPlayer;

export default function AudioListWithPlayback() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [audioList, setAudioList] = useState<string[]>([]);
  const [playingURI, setPlayingURI] = useState<string | null | undefined>(null);
  const [isPaused, setIsPaused] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  async function requestAndroidPermission() {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'App needs access to your microphone to record audio',
          buttonPositive: 'OK'
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    const onAppStateChange = async (next: AppStateStatus) => {
      console.log("appState.current", appState, next);
      if (appState.current === 'active' && next.match(/inactive|background/)) {
        if ((recording && !paused) || !recording) {
          await audioRecorderPlayer.pauseRecorder();
          setIsPaused(true);
          setPaused(true);
        }
      } else
        if (appState.current.match(/inactive|background/) && next === 'active') {
          if (isPaused) {
            await audioRecorderPlayer.resumeRecorder();
            setIsPaused(false);
          }
        }
      appState.current = next;
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [isPaused]);

  const onStartRecord = async () => {
    const hasPermission = await requestAndroidPermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Cannot record without microphone permission.');
      return;
    }
    try {
      await audioRecorderPlayer.startRecorder();
      setRecording(true);
      setPaused(false);
    } catch (error) {
      console.error('Start recording error:', error);
    }
  };

  const onPauseRecord = async () => {
    try {
      await audioRecorderPlayer.pauseRecorder();
      setPaused(true);
    } catch (error) {
      console.error('Pause recording error:', error);
    }
  };

  const onResumeRecord = async () => {
    try {
      await audioRecorderPlayer.resumeRecorder();
      setPaused(false);
    } catch (error) {
      console.error('Resume recording error:', error);
    }
  };

  const onStopRecord = async () => {
    try {
      const uri = await audioRecorderPlayer.stopRecorder();
      setRecording(false);
      setPaused(false);
      if (uri) {
        setAudioList((prev) => [...prev, uri]);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };

  const playAudio = async (uri: string | undefined) => {
    try {
      if (playingURI === uri) {
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
        setPlayingURI(null);
        return;
      }
      if (playingURI) {
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
      }
      await audioRecorderPlayer.startPlayer(uri);
      await audioRecorderPlayer.setVolume(1.0);
      setPlayingURI(uri);
      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition >= e.duration) {
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
          setPlayingURI(null);
          console.log('Playback completed');
        }
      });
      console.log('Playing audio:', uri);
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ height: StatusBar.currentHeight, backgroundColor: '#ff8533' }}>
        <StatusBar barStyle="dark-content" />
      </View>
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={styles.statusText}>
          Recording status: {recording ? (paused ? 'Paused' : 'Recording') : 'Idle'}
        </Text>
        <View style={styles.controlsContainer}>
          {!recording && (
            <TouchableOpacity style={styles.button} onPress={onStartRecord}>
              <MaterialIcons name="play-arrow" size={28} color="white" />
              <Text style={styles.buttonLabel}>Start</Text>
            </TouchableOpacity>
          )}
          {recording && !paused && (
            <>
              <TouchableOpacity style={styles.button} onPress={onPauseRecord}>
                <MaterialIcons name="pause" size={28} color="white" />
                <Text style={styles.buttonLabel}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={onStopRecord}>
                <MaterialIcons name="stop" size={28} color="white" />
                <Text style={styles.buttonLabel}>Stop</Text>
              </TouchableOpacity>
            </>
          )}
          {recording && paused && (
            <>
              <TouchableOpacity style={styles.button} onPress={onResumeRecord}>
                <MaterialIcons name="play-arrow" size={28} color="white" />
                <Text style={styles.buttonLabel}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={onStopRecord}>
                <MaterialIcons name="stop" size={28} color="white" />
                <Text style={styles.buttonLabel}>Stop</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.sectionTitle}>Recorded Audios:</Text>

        <FlatList
          data={audioList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => playAudio(item)}>
              <MaterialIcons
                name={item === playingURI ? 'volume-up' : 'audiotrack'}
                size={24}
                color={item === playingURI ? '#4caf50' : '#333'}
              />
              <Text style={[styles.cardText, item === playingURI && { color: '#4caf50' }]}>
                {item?.split('/').pop() || 'Unknown File'}
              </Text>
              <MaterialIcons
                name={item === playingURI ? 'pause-circle-filled' : 'play-circle-fill'}
                size={28}
                color={item === playingURI ? '#4caf50' : '#333'}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 60 }}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ textAlign: 'center', color: '#666' }}>No recordings yet.</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  statusText: { fontSize: 18, textAlign: 'center', marginBottom: 12 },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ff8533',
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLabel: {
    color: 'white',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '700',
    color: '#333',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardText: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
});

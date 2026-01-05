import {useEffect, useRef} from 'react';
import {Image, Vibration, Platform} from 'react-native';
import Sound from 'react-native-sound';
import InCallManager from 'react-native-incall-manager';

type UseCallAudioParams = {
  inCall: boolean;
};

export default function useCallAudio({inCall}: UseCallAudioParams) {
  const incomingToneRef = useRef<Sound | null>(null);
  const outgoingToneRef = useRef<Sound | null>(null);

  useEffect(() => {
    // console.log('[SoundInit] Starting audio setup...');
    try {
      // ✅ Set playback category
      Sound.setCategory('Playback', true);

      // ✅ Force speakerphone ON for ringing/outgoing tones
      if (Platform.OS === 'android') {
        InCallManager.setSpeakerphoneOn(true);
        // console.log('[SoundInit] Speakerphone forced ON via InCallManager');
      }
    } catch (e) {
      // console.log('[SoundInit] Category set error:', e);
    }

    // ✅ Resolve real file URIs
    const incAsset = Image.resolveAssetSource(
      require('../../assets/audio/ringtone.mp3'),
    );
    const outAsset = Image.resolveAssetSource(
      require('../../assets/audio/outgoing.mp3'),
    );

    // console.log('[SoundInit] Resolved paths:', {
    //   incUri: incAsset?.uri,
    //   outUri: outAsset?.uri,
    //   platform: Platform.OS,
    // });

    // ✅ Load incoming tone
    incomingToneRef.current = new Sound(
      Platform.OS === 'android'
        ? incAsset.uri.replace('file://', '')
        : 'ringtone.mp3',
      Platform.OS === 'android' ? undefined : Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          // console.log('[SoundInit] Incoming load error:', error);
          return;
        }
        // console.log('[SoundInit] Incoming loaded successfully');
        incomingToneRef.current?.setNumberOfLoops(-1);
        incomingToneRef.current?.setVolume(1);
      },
    );

    // ✅ Load outgoing tone
    outgoingToneRef.current = new Sound(
      Platform.OS === 'android'
        ? outAsset.uri.replace('file://', '')
        : 'outgoing.mp3',
      Platform.OS === 'android' ? undefined : Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          // console.log('[SoundInit] Outgoing load error:', error);
          return;
        }
        // console.log('[SoundInit] Outgoing loaded successfully');
        outgoingToneRef.current?.setNumberOfLoops(-1);
        outgoingToneRef.current?.setVolume(1);
      },
    );

    // ✅ Cleanup
    return () => {
      // console.log('[SoundCleanup] Releasing audio resources...');
      try {
        incomingToneRef.current?.release();
        outgoingToneRef.current?.release();
        InCallManager.stop();
      } catch (e) {
        // console.log('[SoundCleanup] Release error:', e);
      }
    };
  }, []);

  // ✅ Switch category based on call state
  useEffect(() => {
    try {
      // console.log('[SoundCategory] Changing category for inCall =', inCall);
      if (inCall) {
        Sound.setCategory('PlayAndRecord', true);
        InCallManager.start({media: 'audio'});
      } else {
        Sound.setCategory('Playback', true);
        InCallManager.stop();
      }
    } catch (e) {
      // console.log('[SoundCategory] Error:', e);
    }
  }, [inCall]);

  // ✅ Play incoming ringtone
  const playIncomingTone = () => {
    const s = incomingToneRef.current;
    // console.log('[SoundPlay-Incoming] Attempting play:', !!s);
    if (!s) {
      // console.warn('[SoundPlay-Incoming] ⚠️ Incoming sound not loaded yet');
      return;
    }
    try {
      s.setVolume(1.0);
      s.setCurrentTime(0);
      s.play(success => {
        console.log(
          '[SoundPlay-Incoming] Playback completed:',
          success ? 'OK' : 'FAILED',
        );
      });
      Vibration.vibrate(1000, true);
    } catch (e) {
      // console.log('[SoundPlay-Incoming] Error:', e);
    }
  };

  // ✅ Stop incoming ringtone
  const stopIncomingTone = () => {
    const s = incomingToneRef.current;
    // console.log('[SoundStop-Incoming] → Attempt stop');
    Vibration.cancel();
    if (!s) {
      // console.log('[SoundStop-Incoming] → No sound instance found');
      return;
    }
    try {
      s.stop(success => {
        // console.log('[SoundStop-Incoming] → stop() callback success?', success);
        s.setCurrentTime(0);
        s.release();
        // console.log('[SoundStop-Incoming] → Released sound');
      });
    } catch (e) {
      // console.log('[SoundStop-Incoming] → Error:', e);
    }
  };

  // ✅ Play outgoing tone
  const playOutgoingTone = () => {
    const s = outgoingToneRef.current;
    // console.log('[SoundPlay-Outgoing] Attempting play:', !!s);
    if (!s) return;
    try {
      s.setVolume(1.0);
      s.setCurrentTime(0);
      s.play(success => {
        console.log(
          '[SoundPlay-Outgoing] Playback completed:',
          success ? 'OK' : 'FAILED',
        );
      });
    } catch (e) {
      // console.log('[SoundPlay-Outgoing] Error:', e);
    }
  };

  // ✅ Stop outgoing tone
  const stopOutgoingTone = () => {
    const s = outgoingToneRef.current;
    // console.log('[SoundStop-Outgoing] → Attempt stop');
    if (!s) {
      // console.log('[SoundStop-Outgoing] → No sound instance found');
      return;
    }
    try {
      s.stop(success => {
        // console.log('[SoundStop-Outgoing] → stop() callback success?', success);
        s.setCurrentTime(0);
        s.release();
        // console.log('[SoundStop-Outgoing] → Released sound');
      });
    } catch (e) {
      // console.log('[SoundStop-Outgoing] → Error:', e);
    }
  };

  return {
    playIncomingTone,
    stopIncomingTone,
    playOutgoingTone,
    stopOutgoingTone,
  };
}

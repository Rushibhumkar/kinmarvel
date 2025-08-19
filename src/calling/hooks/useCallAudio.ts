import {useEffect, useRef} from 'react';
import {Image, Vibration} from 'react-native';
import Sound from 'react-native-sound';

type UseCallAudioParams = {
  inCall: boolean;
};

export default function useCallAudio({inCall}: UseCallAudioParams) {
  const incomingToneRef = useRef<Sound | null>(null);
  const outgoingToneRef = useRef<Sound | null>(null);

  // preload sounds once
  useEffect(() => {
    Sound.setCategory('Playback', true);

    const incAsset = Image.resolveAssetSource(
      // adjust path if your assets live elsewhere
      require('../../assets/audio/ringtone.mp3'),
    );
    const outAsset = Image.resolveAssetSource(
      require('../../assets/audio/outgoing.mp3'),
    );

    incomingToneRef.current = new Sound(
      incAsset?.uri || 'ringtone.mp3',
      incAsset?.uri ? undefined : Sound.MAIN_BUNDLE,
      err => {
        if (!err) {
          incomingToneRef.current?.setNumberOfLoops(-1);
          incomingToneRef.current?.setVolume(1);
        } else {
          console.log('[Sound] incoming load error:', err);
        }
      },
    );

    outgoingToneRef.current = new Sound(
      outAsset?.uri || 'outgoing.mp3',
      outAsset?.uri ? undefined : Sound.MAIN_BUNDLE,
      err => {
        if (!err) {
          outgoingToneRef.current?.setNumberOfLoops(-1);
          outgoingToneRef.current?.setVolume(1);
        } else {
          console.log('[Sound] outgoing load error:', err);
        }
      },
    );

    return () => {
      try {
        incomingToneRef.current?.release();
      } catch {}
      try {
        outgoingToneRef.current?.release();
      } catch {}
    };
  }, []);

  // switch category based on call state
  useEffect(() => {
    try {
      Sound.setCategory(inCall ? 'PlayAndRecord' : 'Playback', true);
    } catch {}
  }, [inCall]);

  const playIncomingTone = () => {
    const s = incomingToneRef.current;
    if (!s) return;
    try {
      s.setCurrentTime?.(0);
      s.play(success => {
        if (!success) console.log('[Sound] incoming play failed');
      });
    } catch {}
    Vibration.vibrate(1000, true);
  };

  const stopIncomingTone = () => {
    const s = incomingToneRef.current;
    Vibration.cancel();
    if (!s) return;
    try {
      s.stop(() => s.setCurrentTime?.(0));
    } catch {}
  };

  const playOutgoingTone = () => {
    const s = outgoingToneRef.current;
    if (!s) return;
    try {
      s.setCurrentTime?.(0);
      s.play(success => {
        if (!success) console.log('[Sound] outgoing play failed');
      });
    } catch {}
  };

  const stopOutgoingTone = () => {
    const s = outgoingToneRef.current;
    if (!s) return;
    try {
      s.stop(() => s.setCurrentTime?.(0));
    } catch {}
  };

  return {
    playIncomingTone,
    stopIncomingTone,
    playOutgoingTone,
    stopOutgoingTone,
  };
}

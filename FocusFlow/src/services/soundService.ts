import { Platform } from 'react-native';

let soundObjects: Record<string, any> = {};
let audioModule: any = null;

export const loadSounds = async () => {
    // Web uses Web Audio API - no preloading needed
    if (Platform.OS === 'web') {
        return;
    }

    // Native: dynamically load expo-av and sounds
    try {
        audioModule = await import('expo-av');
        const Audio = audioModule.Audio;

        // These require calls only execute on native
        const completeSoundFile = require('../../assets/sounds/complete.mp3');
        const tickSoundFile = require('../../assets/sounds/tick.mp3');

        const { sound: completeSound } = await Audio.Sound.createAsync(completeSoundFile);
        const { sound: tickSound } = await Audio.Sound.createAsync(tickSoundFile);

        soundObjects.complete = completeSound;
        soundObjects.tick = tickSound;
    } catch (error) {
        console.log('Error loading sounds:', error);
    }
};

export const playSound = async (name: 'complete' | 'tick') => {
    // Web: use Web Audio API
    if (Platform.OS === 'web') {
        playWebSound(name);
        return;
    }

    // Native: use expo-av
    try {
        if (soundObjects[name]) {
            await soundObjects[name].replayAsync();
        }
    } catch (error) {
        console.log('Error playing sound:', error);
    }
};

// Web Audio API - synthesized sounds
function playWebSound(name: 'complete' | 'tick'): void {
    if (typeof window === 'undefined') return;

    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();

        if (name === 'complete') {
            // Pleasant completion chord (C-E-G major)
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                const start = ctx.currentTime + i * 0.12;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.15, start + 0.03);
                gain.gain.linearRampToValueAtTime(0, start + 0.25);
                osc.start(start);
                osc.stop(start + 0.3);
            });
        } else {
            // Quick click
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        }
    } catch (e) {
        // Silent fail
    }
}

export const playWhiteNoise = async () => {
    // Placeholder
};

export class AudioEngine {
  audioContext: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  microphone: MediaStreamAudioSourceNode | null = null;
  stream: MediaStream | null = null;
  dataArray: Uint8Array | null = null;

  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);

      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.5;

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.microphone.connect(this.analyser);

      console.log('✅ Audio engine initialized');
    } catch (err) {
      console.error('❌ Audio setup error:', err);
      throw new Error('Microphone access denied');
    }
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.dataArray) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getVolume(): number {
    const data = this.getFrequencyData();
    if (!data) return 0;

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return (sum / data.length / 128) * 100;
  }

  cleanup(): void {
    if (this.microphone) {
      this.microphone.disconnect();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    console.log('🧹 Audio engine cleaned up');
  }

  get isInitialized(): boolean {
    return this.audioContext !== null && this.analyser !== null;
  }
}

export const audioEngine = new AudioEngine();

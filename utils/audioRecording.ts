export class AudioRecorder {
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  isRecording = false;

  start(stream: MediaStream): void {
    if (this.isRecording) {
      console.warn('⚠️ Already recording');
      return;
    }

    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    this.isRecording = true;
    console.log('🎙️ Recording started');
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.isRecording = false;
        this.audioChunks = [];
        const sizeKB = (audioBlob.size / 1024).toFixed(2);
        console.log(`✅ Recording stopped (${sizeKB} KB)`);
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('❌ Recording error:', error);
        this.isRecording = false;
        reject(error);
      };

      this.mediaRecorder.stop();
    });
  }

  pause(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
      console.log('⏸️ Recording paused');
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.resume();
      console.log('▶️ Recording resumed');
    }
  }

  get state(): string {
    return this.mediaRecorder?.state || 'inactive';
  }
}

export function createAudioRecorder(): AudioRecorder {
  return new AudioRecorder();
}

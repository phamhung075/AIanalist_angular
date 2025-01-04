// speech-recognition.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface RequiredInfo {
  type: string;
  value: string;
  found: boolean;
}

export interface SpeechRecognitionResult {
  isValid: boolean;
  missingInfo: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  private recognition: any;
  private transcript = '';
  private requiredInfo: RequiredInfo[] = [];
  private isListening = false;

  public transcriptUpdate = new BehaviorSubject<string>('');

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    // Vérifier la disponibilité de l'API Web Speech
    const SpeechRecognition = (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition API non supportée');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'fr-FR';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      this.transcript = finalTranscript;
      this.transcriptUpdate.next(finalTranscript + interimTranscript);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Erreur de reconnaissance vocale:', event.error);
    };
  }

  setRequiredInfo(info: { name: string, center: string, startDate: string, endDate: string, formation: string }) {
    this.requiredInfo = [
      { type: 'name', value: info.name.toLowerCase(), found: false },
      { type: 'center', value: info.center.toLowerCase(), found: false },
      { type: 'startDate', value: info.startDate.toLowerCase(), found: false },
      { type: 'endDate', value: info.endDate.toLowerCase(), found: false },
      { type: 'formation', value: info.formation.toLowerCase(), found: false }
    ];
  }

  startRecognition() {
    if (this.isListening) {
      // Arrêter d'abord si déjà en cours
      try {
        this.recognition.stop();
      } catch (error) {
        console.log('Arrêt de la reconnaissance précédente');
      }
    }

    setTimeout(() => {
      try {
        this.transcript = '';
        this.transcriptUpdate.next('');
        this.recognition.start();
        this.isListening = true;
      } catch (error) {
        console.error('Erreur au démarrage de la reconnaissance:', error);
      }
    }, 100);
  }

  stopRecognition(): Promise<SpeechRecognitionResult> {
    return new Promise((resolve) => {
      if (!this.isListening) {
        resolve({ isValid: false, missingInfo: ['aucun enregistrement audio'] });
        return;
      }

      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Erreur à l\'arrêt de la reconnaissance:', error);
      }

      this.isListening = false;
      const missingInfo: string[] = [];
      const transcriptLower = this.transcript.toLowerCase();

      // Vérifie chaque information requise
      this.requiredInfo.forEach(info => {
        if (!transcriptLower.includes(info.value)) {
          missingInfo.push(info.type);
        }
      });

      resolve({
        isValid: missingInfo.length === 0,
        missingInfo
      });
    });
  }

  getCurrentTranscript(): string {
    console.log('Transcript:', this.transcript);
    return this.transcript;
  }

  dispose() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Erreur lors de la libération de la reconnaissance vocale:', error);
      }
    }
    this.transcriptUpdate.complete();
  }
}
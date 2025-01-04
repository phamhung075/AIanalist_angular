import { Component, ElementRef, ViewChild, OnDestroy, NgZone, ChangeDetectorRef, EventEmitter, Output, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SpeechRecognitionService } from '../../services/speech-recognition-service/speech-recognition.service';
import { FaceDetectionService } from '../../services/face-detection-service/face-detection.service';
import { trigger, transition, style, animate } from '@angular/animations';

interface IdentityDocument {
  type: 'cni' | 'passport' | 'titre_sejour';
  side: 'recto' | 'verso';
  image: string;
}


@Component({
  selector: 'app-kyl-mod',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './kyl-component.component.html',
  styleUrl: './kyl-component.component.scss',
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('1000ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('1000ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('1.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('1.5s ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class KylComponent implements OnDestroy {
  @ViewChild('videoPlayer') videoElement!: ElementRef<HTMLVideoElement>;
  @Input() fullname = 'X Yz';
  @Input() nomFormation = '[nom de la formation]';
  @Input() objectif = '[préciser l\'objectif]';
  @Input() duree = '[préciser la durée]';
  @Input() dateDebut = '[date]';
  @Input() dateFin = '[date]';
  @Output() kycCompleted = new EventEmitter<any>();

  beneficiaire = {
    fullname: 'Dai Hung',
    email: 'daihung.pham@yopmail.com',
  };

  formation = {
    nomFormation: 'Formation de développement',
    objectif: 'Réussir la formation',
    duree: '30 jours',
    dateDebut: this.formatDate(new Date()),
    dateFin: this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  };

  consentForm: FormGroup;
  antiFraudForm: FormGroup;
  recordingState = signal<'initial' | 'positioning' | 'recording' | 'preview' | 'processing' | 'confirmed'>('initial');
  isUserInFrame = signal(false);
  warningMessageRecording = signal("");
  canConfirmer = signal(false);

  documents: Record<string, IdentityDocument> = {};
  selectedDocType: 'cni' | 'passport' | 'titre_sejour' | null = null;
  documentTypes = [
    { label: 'Carte d\'identité', value: 'cni', icon: 'fas fa-id-card' },
    { label: 'Passeport', value: 'passport', icon: 'fas fa-passport' },
    { label: 'Titre de séjour', value: 'titre_sejour', icon: 'fas fa-address-card' }
  ];

  dpoEmail = 'dpo@example.com';
  textToSay = `
    Je soussigné(e) Monsieur/Madame ${this.beneficiaire.fullname}, certifie que les informations que je déclare sont exactes et sincères.
    Je me suis inscrit(e) à la formation intitulée ${this.formation.nomFormation}, ayant pour objectif ${this.formation.objectif},
    d'une durée de ${this.formation.duree}, qui débute le ${this.formation.dateDebut} et se termine le ${this.formation.dateFin}.
    Toutes les informations nécessaires à mon inscription y étaient mentionnées.
  `;

  countdown: number | null = null;
  currentStep = 1;
  raisonError ='';
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private maxRecordingDuration = 60; // 60 seconds
  private totalRecordingTime = 0; // Total recording time in seconds
  private faceDetectedTime = 0; // Time face was detected in seconds
  private faceMissingTimeout: any = null;
  private detectionInterval: any = null;
  private countdownTimer: any = null;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private faceDetectionService: FaceDetectionService,
    private speechRecognitionService: SpeechRecognitionService
  ) {
    this.consentForm = this.fb.group({ consent: [false, Validators.requiredTrue] });
    this.antiFraudForm = this.fb.group({ agreement: [false, Validators.requiredTrue] });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  nextStep(): void {
    if (this.currentStep < 4) {
      this.currentStep++;
      this.cdr.detectChanges();
    }
  }


  selectDocumentType(type: string): void {
    this.selectedDocType = type as 'cni' | 'passport' | 'titre_sejour';
    this.documents = {};
  }

  handleDocumentUpload(event: Event, side: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0] && this.selectedDocType) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.documents[side] = {
          type: this.selectedDocType!,
          side: side as 'recto' | 'verso',
          image: e.target?.result as string
        };
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  isDocumentComplete(): boolean {
    return !!this.selectedDocType &&
      !!this.documents['recto']?.image &&
      !!this.documents['verso']?.image;
  }

  //********************************************* */
  //DETECTION FACE
  //********************************************* */
  // Stream Management
  stopStream(): void {
    this.stopMediaStream(this.stream);
    this.stream = null;
  }

  // Monitor Face Detection
  monitorFaceDetection(videoElement: HTMLVideoElement): void {
    this.faceDetectionService.detectFaces(videoElement).subscribe({
      next: (isFaceDetected) => this.handleFaceDetection(isFaceDetected, videoElement),
      error: (err) => this.handleFaceDetectionError(err),
    });
  }

  handleFaceDetection(isFaceDetected: boolean, videoElement: HTMLVideoElement): void {
    this.isUserInFrame.set(isFaceDetected);

    if (isFaceDetected) {
      this.clearFaceMissingWarning();
    } else {
      this.startFaceMissingCountdown(videoElement);
    }
  }

  handleFaceDetectionError(err: any): void {
    console.error('Face detection error:', err);
    this.isUserInFrame.set(false);
    this.warningMessageRecording.set('Erreur de détection du visage' + (this.raisonError ? (' : ' + this.raisonError) : "."));
    this.faceDetectionService.dispose();
  }

  clearFaceMissingWarning(): void {
    clearTimeout(this.faceMissingTimeout);
    this.faceMissingTimeout = null;
    this.warningMessageRecording.set('');
  }

  startFaceMissingCountdown(videoElement: HTMLVideoElement): void {
    if (!this.faceMissingTimeout) {
      let countdown = 2; // Countdown in seconds
      this.warningMessageRecording.set(`Visage non détecté`);
      this.faceMissingTimeout = setInterval(() => {
        this.warningMessageRecording.set(
          `Visage non détecté. Effacement de la vidéo dans ${countdown} seconde(s).`
        );
        countdown--;

        if (countdown < 0) {
          this.clearFaceMissingCountdown(videoElement);
        }
      }, 1000);
    }
  }

  clearFaceMissingCountdown(videoElement: HTMLVideoElement): void {
    clearTimeout(this.faceMissingTimeout);
    this.faceMissingTimeout = null;
    this.resetVideoState(videoElement);
    this.startPositioning();
  }

  resetVideoState(videoElement: HTMLVideoElement): void {
    this.stopMediaStream(videoElement.srcObject as MediaStream);
    videoElement.srcObject = null;
    this.isUserInFrame.set(false);
    this.warningMessageRecording.set('');
    this.faceDetectionService.dispose();
  }

  // Positioning
  async startPositioning(): Promise<void> {
    this.stopStream();
    this.warningMessageRecording.set('');
    this.isUserInFrame.set(false);

    try {
      const constraints = this.getMediaConstraints();
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.videoElement?.nativeElement) {
        const videoEl = this.videoElement.nativeElement;
        this.initializeVideoStream(videoEl, this.stream);
        this.recordingState.set('positioning');
      }
    } catch (err) {
      console.error('Error during camera initialization:', err);
      this.recordingState.set('initial');
    }
  }

  getMediaConstraints(): MediaStreamConstraints {
    return {
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };
  }

  initializeVideoStream(videoEl: HTMLVideoElement, stream: MediaStream): void {
    videoEl.srcObject = stream;
    videoEl.muted = true;
    videoEl.play();
    this.monitorFaceDetection(videoEl);
  }

  // Recording
  async startRecording(): Promise<void> {
    if (this.countdownTimer) {
      this.clearCountdown();
    }

    if (!this.stream) {
      console.error('No media stream available for recording.');
      return;
    }

    this.canConfirmer.set(false);

    try {
      this.setupMediaRecorder();
      this.recordingState.set('recording');
      this.startCountdown();
      this.startTrackingFaceDetection();
    } catch (error) {
      console.error('Error while starting the recording:' + this.raisonError, error);
    }
  }

  setupMediaRecorder(): void {
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    this.mediaRecorder = new MediaRecorder(this.stream!, options);
    this.chunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }

  startTrackingFaceDetection(): void {
    this.totalRecordingTime = 0;
    this.faceDetectedTime = 0;

    this.detectionInterval = setInterval(() => {
      this.totalRecordingTime++;
      if (this.isUserInFrame()) {
        this.faceDetectedTime++;
      }
    }, 1000);

    this.monitorFaceDetection(this.videoElement.nativeElement);
  }

  stopTrackingFaceDetection(): void {
    clearInterval(this.detectionInterval);
    this.faceDetectionService.dispose();
  }

  // Countdown
  private startCountdown(): void {
    this.clearCountdown();
    this.countdown = this.maxRecordingDuration;

    this.countdownTimer = setInterval(() => {
      if (this.countdown === null || this.countdown <= 0) {
        this.clearCountdown();
        this.stopRecording();
        return;
      }

      this.countdown--;
      this.cdr.detectChanges();
    }, 1000);
  }

  clearCountdown(): void {
    clearInterval(this.countdownTimer);
    this.countdownTimer = null;
  }

  // Stop Recording
  stopRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      console.log('Stopping recording...');
      this.clearCountdown();
      this.clearDetectionInterval();
      this.mediaRecorder.stop();
      this.faceDetectionService.dispose();
      this.stopMediaStream(this.stream);
      this.handleRecordingStop();
    } else {
      console.warn('MediaRecorder is not in recording state.');
    }
  }

  handleRecordingStop(): void {
    this.mediaRecorder!.onstop = () => {
      const blob = new Blob(this.chunks, { type: 'video/webm' });
      const videoURL = URL.createObjectURL(blob);

      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = null;
        this.videoElement.nativeElement.src = videoURL;
      }

      this.finalizeRecording();
    };

    this.clearDetectionInterval();
  }

  

  finalizeRecording(): void {
    this.stopTrackingFaceDetection();
    const detectionPercentage = (this.faceDetectedTime / this.totalRecordingTime) * 100;

    if (detectionPercentage < 98) {
      this.canConfirmer.set(false);
      this.handleLowDetectionPercentage(detectionPercentage);
    } else {
      this.recordingState.set('preview');
      // video must longer than 10 seconds
      if (this.totalRecordingTime < 10) {
        this.raisonError = 'La vidéo doit être plus longue que 10 secondes.';
        this.warningMessageRecording.set(this.raisonError);
        setTimeout(() => {
          this.resetRecordingState();
        }, 5000);
        return;
      }
      this.canConfirmer.set(true);
    }
    this.cdr.detectChanges();
  }


  handleLowDetectionPercentage(detectionPercentage: number): void {
    this.raisonError = 'La vidéo n\'a pas été enregistrée correctement. Le visage n\'a été détecté que ' + detectionPercentage.toFixed(2) + '% du temps.';
    this.warningMessageRecording.set(
      this.raisonError
    );

    setTimeout(() => {
      this.resetRecordingState();
    }, 5000);
  }

  resetRecordingState(): void {
    this.recordingState.set('initial');
    this.clearVideoElement();
    this.resetTrackingData();
  }

  clearVideoElement(): void {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.src = '';
    }
  }

  resetTrackingData(): void {
    this.chunks = [];
    this.mediaRecorder = null;
    this.stream = null;
    this.faceDetectedTime = 0;
    this.totalRecordingTime = 0;
    this.countdown = null;
    this.countdownTimer = null;
    this.warningMessageRecording.set('');
  }

  clearDetectionInterval(): void {
    clearInterval(this.detectionInterval);
    this.detectionInterval = null;
  }

  // Helper to stop media streams
  private stopMediaStream(stream: MediaStream | null): void {
    stream?.getTracks().forEach((track) => track.stop());
  }

  confirmPreview(): void {
    this.recordingState.set('preview');
    this.canConfirmer.set(false);
  }

  async complete() {
    if (!this.antiFraudForm.valid) return;

    try {
      const kycData = {
        consent: this.consentForm.value.consent,
        documentType: this.selectedDocType,
        documents: this.documents,
        video: new Blob(this.chunks, { type: 'video/webm' }),
        antiFraudAgreement: this.antiFraudForm.value.agreement,
        completedAt: new Date().toISOString()
      };

      // Utilisation du bon EventEmitter
      this.kycCompleted.emit(kycData);
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
    }
  }

  ngOnDestroy(): void {
    // Nettoyer la reconnaissance vocale
    this.speechRecognitionService.stopRecognition();
    this.speechRecognitionService.dispose();

    // Arrêter la détection faciale
    this.faceDetectionService.dispose();

    // Nettoyer le flux vidéo
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    // Nettoyer les URLs d'objets
    if (this.videoElement?.nativeElement?.src) {
      URL.revokeObjectURL(this.videoElement.nativeElement.src);
    }

    // Nettoyer les documents
    Object.values(this.documents).forEach(doc => {
      if (doc.image && doc.image.startsWith('blob:')) {
        URL.revokeObjectURL(doc.image);
      }
    });
  }
}
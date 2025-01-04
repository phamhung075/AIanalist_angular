// face-detection.service.ts
import { Injectable } from '@angular/core';
import * as faceDetection from '@tensorflow-models/face-detection';
import * as tf from '@tensorflow/tfjs';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FaceDetectionService {
  private detector: faceDetection.FaceDetector | null = null;
  public faceInFrame = new BehaviorSubject<boolean>(false);
  private detectorReady = false;
  private initPromise: Promise<void>;
  private lastCenteredStates: boolean[] = [];  // Pour stocker les N derniers états
  private readonly stateBufferSize = 3;

  constructor() {
    this.initPromise = this.initializeTensorFlow();
  }

  async waitForDetector(): Promise<void> {
    if (!this.detectorReady) {
      await this.initPromise;
    }
    return;
  }

  private async initializeTensorFlow() {
    try {
      // Tester les backends disponibles
      const backends = ['webgl', 'wasm', 'cpu'];
      let backendSet = false;

      for (const backend of backends) {
        try {
          console.log(`Trying to set backend: ${backend}`);
          await tf.setBackend(backend);
          await tf.ready();
          backendSet = true;
          console.log(`Successfully initialized TensorFlow.js with ${backend} backend`);
          break;
        } catch (e) {
          console.warn(`Failed to set ${backend} backend:`, e);
        }
      }

      if (!backendSet) {
        throw new Error('No suitable backend found');
      }

      // Charger les modèles nécessaires
      tf.enableProdMode(); // Optimisation des performances
      tf.env().set('WEBGL_PACK', false); // Éviter certains bugs de WebGL
      await this.initializeDetector();
      this.detectorReady = true;
    } catch (error) {
      console.error('Error initializing TensorFlow:', error);
      throw error;
    }
  }

  private async initializeDetector() {
    try {
      // Vérifier que TensorFlow est bien initialisé
      if (!tf.getBackend()) {
        throw new Error('TensorFlow backend not initialized');
      }

      const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
      const detectorConfig = {
        runtime: 'mediapipe' as const,
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
        modelType: 'short' as const,  // Modèle plus léger pour de meilleures performances
        maxFaces: 1,
        refineLandmarks: false,  // Désactiver pour de meilleures performances
      };

      console.log('Initializing face detector with config:', detectorConfig);
      this.detector = await faceDetection.createDetector(model, detectorConfig);
      console.log('Face detector initialized successfully with backend:', tf.getBackend());

      // Test initial du détecteur
      await this.testDetector();
    } catch (error) {
      console.error('Error initializing face detector:', error);
      throw error;
    }
  }


  private async testDetector() {
    if (!this.detector) {
      console.error('Detector not initialized, skipping test.');;
      return;
    }
    try {
      // Créer une image de test
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 100;
      testCanvas.height = 100;
      const ctx = testCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 100, 100);
      }

      // Tester le détecteur
      await this.detector.estimateFaces(testCanvas);
      console.log('Detector test successful');
    } catch (error) {
      console.error('Detector test failed:', error);
      throw error;
    }
  }

  private normalizeBox(box: any, video: HTMLVideoElement) {
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;

    return {
      xMin: (box.xMin / videoWidth) * 100,
      xMax: (box.xMax / videoWidth) * 100,
      yMin: (box.yMin / videoHeight) * 100,
      yMax: (box.yMax / videoHeight) * 100,
      width: (box.width / videoWidth) * 100,
      height: (box.height / videoHeight) * 100,
    };
  }

  private isBoxCentered(normalizedBox: any): boolean {
    const centerXPercent = normalizedBox.xMin + normalizedBox.width / 2;
    const centerYPercent = normalizedBox.yMin + normalizedBox.height / 2;

    return (
      centerXPercent >= 15 &&
      centerXPercent <= 95 &&
      centerYPercent >= 15 &&
      centerYPercent <= 95 &&
      normalizedBox.width >= 15 &&
      normalizedBox.width <= 95 &&
      normalizedBox.xMin >= 15 &&
      normalizedBox.xMax <= 95 &&
      normalizedBox.yMin >= 15 &&
      normalizedBox.yMax <= 95
    );
  }


  detectFaces(video: HTMLVideoElement): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      let intervalId: number;

      const detectionLoop = async () => {
        try {
          if (!this.detector) {
            await this.initializeDetector();
          }
          // Vérifier si la camera est horizontale
          const videoAspectRatio = video.videoWidth / video.videoHeight;
          const isHorizontal = videoAspectRatio > 1;
          const predictions = await this.detector!.estimateFaces(video, {
            flipHorizontal: isHorizontal,
          });

          if (predictions.length > 0) {
            const normalizedBox = this.normalizeBox(predictions[0].box, video);
            const isCentered = this.isBoxCentered(normalizedBox);
            this.updateCenteredState(isCentered);
            observer.next(isCentered);
          } else {
            this.updateCenteredState(false);
            observer.next(false);
          }
        } catch (error) {
          console.error('Face detection error:', error);
          this.updateCenteredState(false);
          observer.error(error);
        }
      };

      // Start detection loop every 0.5 second
      intervalId = window.setInterval(detectionLoop, 500);

      // Cleanup logic on unsubscribe
      return () => {
        clearInterval(intervalId);
        observer.complete();
      };
    });
  }


  private updateCenteredState(newState: boolean): boolean {
    // Ajouter le nouvel état au buffer
    this.lastCenteredStates.push(newState);

    // Garder seulement les N derniers états
    if (this.lastCenteredStates.length > this.stateBufferSize) {
      this.lastCenteredStates.shift();
    }

    // Un visage est considéré centré si la majorité des derniers états sont true
    const trueStates = this.lastCenteredStates.filter(state => state).length;
    const isCentered = trueStates >= Math.ceil(this.stateBufferSize / 2);

    // Mettre à jour le BehaviorSubject seulement si l'état change
    if (this.faceInFrame.value !== isCentered) {
      this.faceInFrame.next(isCentered);
    }

    return isCentered;
  }

  dispose() {
    if (this.detector) {
      try {
        // @ts-ignore
        this.detector.dispose();
      } catch (e) {
        console.error('Error disposing detector:', e);
      }
      this.detector = null;
      this.detectorReady = false;
    }
  }
}
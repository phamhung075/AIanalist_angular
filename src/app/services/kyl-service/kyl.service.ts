import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { RestService } from '../_core/rest-service/rest.service';
import { KYL, CreateKYLDto } from '../../models/kyl.model';

export interface Kyl {
  id?: string;
  session_id: string;
  status: string;
  beneficiaries?: Beneficiary[];
}

export interface Beneficiary {
  id?: string;
  kyl_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  email?: string;
  phone?: string;
  address?: string;
  id_type?: string;
  id_number?: string;
  video_key?: string;
  verification_status?: string;
  verification_notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KylService {
  constructor(private rest: RestService) {}

  getUserCredits(): Observable<number> {
    return this.rest.get<{ credits_balance: number }>('/users/me/credits')
      .pipe(
        map(response => response.credits_balance),
        catchError(error => {
          console.error('Erreur lors de la récupération des crédits:', error);
          return throwError(() => error);
        })
      );
  }
  getKYLs(): Observable<KYL[]> {
    return this.rest.get<KYL[]>('/kyls/admin').pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des KYLs:', error);
        return throwError(() => error);
      })
    );
  }

  getKYLById(id: string): Observable<KYL> {
    return this.rest.get<KYL>(`/kyls/${id}`).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération du KYL:', error);
        return throwError(() => error);
      })
    );
  }

  createKYL(data: CreateKYLDto): Observable<KYL> {
    return this.rest.post<KYL>('/kyls', data).pipe(
      catchError(error => {
        if (error.status === 400 && error.error?.message?.includes('crédits')) {
          return throwError(() => new Error('Crédits insuffisants pour créer un nouveau KYL'));
        }
        console.error('Erreur lors de la création du KYL:', error);
        return throwError(() => error);
      })
    );
  }

  updateKYLStatus(id: string, status: KYL['status']): Observable<KYL> {
    return this.rest.patch<KYL>(`/kyls/${id}`, { status }).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return throwError(() => error);
      })
    );
  }

  getKyls(): Observable<Kyl[]> {
    return this.rest.get<Kyl[]>('/kyls');
  }

  getKylById(id: string): Observable<Kyl> {
    return this.rest.get<Kyl>(`/kyls/${id}`);
  }

  createKyl(kyl: Kyl): Observable<Kyl> {
    return this.rest.post<Kyl>('/kyls', kyl);
  }

  updateKylStatus(id: string, status: string): Observable<Kyl> {
    return this.rest.patch<Kyl>(`/kyls/${id}`, { status });
  }

  // Beneficiary methods
  createBeneficiary(beneficiary: Beneficiary): Observable<Beneficiary> {
    return this.rest.post<Beneficiary>('/beneficiaries', beneficiary);
  }

  uploadVideo(kylId: string, videoFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('video', videoFile);
    return this.rest.post<any>(`/kyls/${kylId}/video`, formData);
  }

  getBeneficiaryVideo(videoKey: string): Observable<string> {
    return this.rest.get<string>(`/kyls/video/${videoKey}`);
  }
}
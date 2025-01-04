import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RestService } from '../_core/rest-service/rest.service';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  constructor(private restService: RestService) { }

  // Fetch video by name
  getVideoByName(videoName: string): Observable<Blob> {
    return this.restService.get<Blob>(`/${videoName}`, {
      headers: { Accept: 'video/mp4' },
      responseType: 'blob',
    }).pipe(
      catchError((error) => this.handleError(error) as Observable<Blob>)
    );
  }

  
  // Error handling function
  private handleError(error: any): Observable<never> {
    console.error('Error:', error);
    return throwError(() => new Error(error.message || 'Unknown error occurred.'));
  }
}
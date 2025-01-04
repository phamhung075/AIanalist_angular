import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RestService {
  private apiUrl = environment.urlBackend;
  private apiVersion = environment.baseapi;

  constructor(private http: HttpClient) {}

  private createOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: true, // Important for sending/receiving cookies
    };
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http
      .get<T>(
        `${this.apiUrl}${this.apiVersion}${endpoint}`,
        this.createOptions()
      )
      .pipe(catchError(this.handleError));
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .post<T>(
        `${this.apiUrl}${this.apiVersion}${endpoint}`,
        data,
        this.createOptions()
      )
      .pipe(catchError(this.handleError));
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .put<T>(
        `${this.apiUrl}${this.apiVersion}${endpoint}`,
        data,
        this.createOptions()
      )
      .pipe(catchError(this.handleError));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(
        `${this.apiUrl}${this.apiVersion}${endpoint}`,
        this.createOptions()
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}

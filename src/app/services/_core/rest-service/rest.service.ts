import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { TokenService } from '../token-service/token.service';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RestService {
  private apiUrl = `${environment.urlBackend}/api`;

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.handleRequest<T>('GET', endpoint, null, params);
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.handleRequest<T>('POST', endpoint, data);
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.handleRequest<T>('PUT', endpoint, data);
  }

  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.handleRequest<T>('PATCH', endpoint, data);
  }

  delete<T>(endpoint: string, params?: any): Observable<T> {
    return this.handleRequest<T>('DELETE', endpoint, null, params);
  }

  private handleRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: any
  ): Observable<T> {
    const httpOptions: any = {
      headers: new HttpHeaders(),
      params: new HttpParams(),
      withCredentials: true, // Use cookies for refreshToken
    };

    // Add query parameters if provided
    if (params) {
      Object.keys(params).forEach((key) => {
        httpOptions.params = httpOptions.params.set(key, params[key]);
      });
    }

    // Attach the accessToken to the Authorization header
    const accessToken = this.tokenService.getIdToken();
    if (accessToken) {
      httpOptions.headers = httpOptions.headers.set(
        'Authorization',
        `Bearer ${accessToken}`
      );
    }

    // Make the HTTP request and handle errors
    return this.http.request<T>(method, `${this.apiUrl}${endpoint}`, {
      ...httpOptions,
      body: data,
      observe: 'events', // Observe HTTP events for detailed lifecycle tracking
    }).pipe(
      filter((event: HttpEvent<T>) => event.type === HttpEventType.Response), // Only handle the response event
      map((event: any) => event.body), // Extract the response body
      catchError((error: HttpErrorResponse) => {
        // If the error is due to an expired token, refresh it
        if (error.status === 401 && !endpoint.includes('/auth/refresh')) {
          return this.tokenService.refreshIdToken().pipe(
            switchMap(() => {
              // Retry the request with the new accessToken
              const newIdToken = this.tokenService.getIdToken();
              if (newIdToken) {
                httpOptions.headers = httpOptions.headers.set(
                  'Authorization',
                  `Bearer ${newIdToken}`
                );
              }
              return this.http.request<T>(method, `${this.apiUrl}${endpoint}`, {
                ...httpOptions,
                body: data,
                observe: 'events',
              }).pipe(
                filter((event: HttpEvent<T>) => event.type === HttpEventType.Response),
                map((event: any) => event.body)
              );
            })
          );
        }
        return throwError(() => error); // Throw other errors
      })
    );
  }
}
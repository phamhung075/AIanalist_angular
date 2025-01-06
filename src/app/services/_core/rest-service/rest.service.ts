import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RestService {
  private apiUrl = `${environment.urlBackend}${environment.baseapi}`;

  constructor(private http: HttpClient) {
    console.log('Environment:', environment.production ? 'Production' : 'Development');
    console.log('API URL:', this.apiUrl);
  }

  private createRequestOptions(params?: any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const options = {
      headers,
      params: new HttpParams(),
      withCredentials: true,
      observe: 'response' as const
    };

    if (params) {
      Object.keys(params).forEach((key) => {
        options.params = options.params.set(key, params[key]);
      });
    }

    return options;
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    console.log(`Making GET request to: ${url}`);
    
    return this.http.get<T>(url, this.createRequestOptions(params)).pipe(
      tap({
        next: (response: any) => {
          console.log(`Response from ${endpoint}:`, response.body);
        },
        error: (error) => {
          console.error(`Error in GET request to ${endpoint}:`, {
            status: error.status,
            message: error.message
          });
        }
      }),
      map((response: any) => response.body)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    console.log(`Making POST request to: ${url}`, data);
    
    return this.http.post<T>(url, data, this.createRequestOptions()).pipe(
      tap({
        next: (response: any) => {
          console.log(`Response from ${endpoint}:`, response.body);
        },
        error: (error) => console.error(`Error in POST request to ${endpoint}:`, error)
      }),
      map((response: any) => response.body)
    );
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
    const url = `${this.apiUrl}${endpoint}`;
    console.log(`Making ${method} request to: ${url}`, data);

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      params: new HttpParams(),
      withCredentials: true,
      observe: 'response' as const
    };

    if (params) {
      Object.keys(params).forEach((key) => {
        httpOptions.params = httpOptions.params.set(key, params[key]);
      });
    }

    return this.http.request<T>(method, url, {
      ...httpOptions,
      body: data
    }).pipe(
      tap({
        next: (response: any) => {
          console.log(`Response from ${endpoint}:`, response.body);
        },
        error: (error) => console.error(`Error in ${method} request to ${endpoint}:`, error)
      }),
      map((response: any) => response.body),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Full error response:', error);
    
    if (error.error && 'success' in error.error && !error.error.success) {
      return throwError(() => error.error);
    }

    return throwError(() => ({
      success: false,
      code: error.status,
      message: error.message,
      metadata: {
        timestamp: new Date().toISOString(),
        statusCode: error.status === 0 ? 'NETWORK_ERROR' : error.statusText,
        description: error.message,
        responseTime: '0ms'
      }
    }));
  }
}
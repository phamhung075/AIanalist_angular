import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '../_core/rest-service/rest.service';

@Injectable({
  providedIn: 'root'
})
export class StripeService {

  constructor(private rest: RestService) { }

  createCheckoutSession(packId: string): Observable<{ url: string }> {
    return this.rest.post<{ url: string }>('/stripe/create-checkout-session', {
      packId
    });
  }
}
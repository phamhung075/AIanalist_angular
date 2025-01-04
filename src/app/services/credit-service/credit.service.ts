import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from './../_core/rest-service/rest.service';
import { CreditTransaction } from '../../models/credit-transaction.model';

@Injectable({
  providedIn: 'root'
})
export class CreditService {
  constructor(private rest: RestService) {}

  getBalance(): Observable<number> {
    return this.rest.get<number>('/credits/balance');
  }

  getTransactions(): Observable<CreditTransaction[]> {
    return this.rest.get<CreditTransaction[]>('/credits/transactions');
  }

  purchaseCredits(amount: number): Observable<CreditTransaction> {
    return this.rest.post<CreditTransaction>('/credits/purchase', { amount });
  }

  useCredits(amount: number, description: string): Observable<CreditTransaction> {
    return this.rest.post<CreditTransaction>('/credits/use', { amount, description });
  }
}
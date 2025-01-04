import { TestBed } from '@angular/core/testing';
import { KylService } from './kyl.service';


describe('KylService', () => {
  let service: KylService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KylService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

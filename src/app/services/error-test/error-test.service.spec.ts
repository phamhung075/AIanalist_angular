import { TestBed } from '@angular/core/testing';

import { ErrorTestService } from './error-test.service';

describe('ErrorTestService', () => {
  let service: ErrorTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { RouteLoggingService } from './route-logging.service';

describe('RouteLoggingService', () => {
  let service: RouteLoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RouteLoggingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

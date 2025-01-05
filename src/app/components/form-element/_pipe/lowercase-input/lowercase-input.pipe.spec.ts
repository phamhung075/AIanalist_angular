import { TestBed } from '@angular/core/testing';
import { LowercaseInputPipe } from './lowercase-input.pipe';


describe('LowercaseInputService', () => {
  let service: LowercaseInputPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LowercaseInputPipe);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorTestComponent } from './error-test.component';

describe('ErrorTestComponent', () => {
  let component: ErrorTestComponent;
  let fixture: ComponentFixture<ErrorTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

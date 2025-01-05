import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldHeaderComponent } from './form-field-header.component';

describe('FormFieldHeaderComponent', () => {
  let component: FormFieldHeaderComponent;
  let fixture: ComponentFixture<FormFieldHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldHeaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormFieldHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

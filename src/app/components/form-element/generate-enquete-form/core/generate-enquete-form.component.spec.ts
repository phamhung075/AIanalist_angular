import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateEnqueteFormComponent } from './generate-enquete-form.component';

describe('GenerateEnqueteFormComponent', () => {
  let component: GenerateEnqueteFormComponent;
  let fixture: ComponentFixture<GenerateEnqueteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenerateEnqueteFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GenerateEnqueteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

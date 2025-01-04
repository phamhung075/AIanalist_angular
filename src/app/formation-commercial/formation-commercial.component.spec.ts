import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormationCommercialComponent } from './formation-commercial.component';

describe('FormationCommercialComponent', () => {
  let component: FormationCommercialComponent;
  let fixture: ComponentFixture<FormationCommercialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormationCommercialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormationCommercialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

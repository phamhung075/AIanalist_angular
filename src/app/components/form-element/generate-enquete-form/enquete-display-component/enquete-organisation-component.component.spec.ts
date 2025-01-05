import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnqueteOrganisationComponent } from './enquete-organisation-component.component';

describe('EnqueteOrganisationComponent', () => {
  let component: EnqueteOrganisationComponent;
  let fixture: ComponentFixture<EnqueteOrganisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnqueteOrganisationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnqueteOrganisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

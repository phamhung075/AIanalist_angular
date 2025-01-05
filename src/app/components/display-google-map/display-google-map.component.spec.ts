import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayGoogleMapComponent } from './display-google-map.component';

describe('DisplayGoogleMapComponent', () => {
  let component: DisplayGoogleMapComponent;
  let fixture: ComponentFixture<DisplayGoogleMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DisplayGoogleMapComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DisplayGoogleMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnqueteResponseComponent } from './enquete-response-component.component';

describe('EnqueteDisplayComponent', () => {
  let component: EnqueteResponseComponent;
  let fixture: ComponentFixture<EnqueteResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnqueteResponseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnqueteResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

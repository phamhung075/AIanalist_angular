import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnqueteGeneratorComponentComponent } from './enquete-generator-component.component';

describe('EnqueteGeneratorComponentComponent', () => {
  let component: EnqueteGeneratorComponentComponent;
  let fixture: ComponentFixture<EnqueteGeneratorComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnqueteGeneratorComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EnqueteGeneratorComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

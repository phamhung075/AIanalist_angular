import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatFileSelectComponent } from './mat-file-select.component';

describe('MatFileSelectComponent', () => {
  let component: MatFileSelectComponent;
  let fixture: ComponentFixture<MatFileSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatFileSelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MatFileSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

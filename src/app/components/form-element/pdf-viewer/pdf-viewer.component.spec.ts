import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatPdfViewerComponent } from './pdf-viewer.component';

describe('MatPdfViewerComponent', () => {
  let component: MatPdfViewerComponent;
  let fixture: ComponentFixture<MatPdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MatPdfViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MatPdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

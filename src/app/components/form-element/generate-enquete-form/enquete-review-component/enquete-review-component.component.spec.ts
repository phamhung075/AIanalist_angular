import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnqueteReviewComponent } from './enquete-review-component.component';

describe('EnqueteDisplayComponent', () => {
  let component: EnqueteReviewComponent;
  let fixture: ComponentFixture<EnqueteReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnqueteReviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnqueteReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

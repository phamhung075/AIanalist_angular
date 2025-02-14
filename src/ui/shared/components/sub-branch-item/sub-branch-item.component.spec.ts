import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubBranchItemComponent } from './sub-branch-item.component';

describe('SubBranchItemComponent', () => {
  let component: SubBranchItemComponent;
  let fixture: ComponentFixture<SubBranchItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubBranchItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubBranchItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

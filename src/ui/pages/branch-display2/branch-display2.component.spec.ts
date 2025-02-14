import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchDisplay2Component } from './branch-display2.component';

describe('BranchDisplay2Component', () => {
  let component: BranchDisplay2Component;
  let fixture: ComponentFixture<BranchDisplay2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchDisplay2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BranchDisplay2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

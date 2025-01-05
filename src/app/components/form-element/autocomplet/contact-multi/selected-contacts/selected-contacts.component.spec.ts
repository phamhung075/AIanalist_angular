import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectedContactsComponent } from './selected-contacts.component';

describe('SelectedContactsComponent', () => {
  let component: SelectedContactsComponent;
  let fixture: ComponentFixture<SelectedContactsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectedContactsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectedContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactSelectorComponent } from './contact-selector.component';

describe('ContactSelectorComponent', () => {
  let component: ContactSelectorComponent;
  let fixture: ComponentFixture<ContactSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

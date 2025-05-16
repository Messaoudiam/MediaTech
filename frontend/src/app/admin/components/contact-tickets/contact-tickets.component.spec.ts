import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactTicketsComponent } from './contact-tickets.component';

describe('ContactTicketsComponent', () => {
  let component: ContactTicketsComponent;
  let fixture: ComponentFixture<ContactTicketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactTicketsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

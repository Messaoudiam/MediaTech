import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactTicketsComponent } from './contact-tickets.component';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ContactTicketService } from '../../services/contact-ticket.service';
import { of } from 'rxjs';

describe('ContactTicketsComponent', () => {
  let component: ContactTicketsComponent;
  let fixture: ComponentFixture<ContactTicketsComponent>;
  let httpMock: HttpTestingController;
  let ticketServiceSpy: jasmine.SpyObj<ContactTicketService>;

  beforeEach(async () => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    // Mock du service ContactTicketService
    const contactTicketServiceSpy = jasmine.createSpyObj(
      'ContactTicketService',
      ['getAllTickets', 'markAsResolved']
    );

    // Mock de la réponse getAllTickets avec un array vide
    contactTicketServiceSpy.getAllTickets.and.returnValue(of([]));
    contactTicketServiceSpy.markAsResolved.and.returnValue(
      of({ success: true })
    );

    await TestBed.configureTestingModule({
      imports: [
        ContactTicketsComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: Router, useValue: routerSpyObj },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ContactTicketService, useValue: contactTicketServiceSpy },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    ticketServiceSpy = TestBed.inject(
      ContactTicketService
    ) as jasmine.SpyObj<ContactTicketService>;

    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();

    fixture = TestBed.createComponent(ContactTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    const openRequests = httpMock.match(() => true);
    openRequests.forEach((req) => {
      if (req.request.url.includes('/auth/check-auth')) {
        req.flush(null, { status: 401, statusText: 'Unauthorized' });
      } else {
        req.flush({}, { status: 200, statusText: 'OK' });
      }
    });
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

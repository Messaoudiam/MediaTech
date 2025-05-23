import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookEditComponent } from './book-edit.component';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BookService } from '../../core/services/book.service';
import { NotificationService } from '../../core/services/notification.service';
import { of } from 'rxjs';

describe('BookEditComponent', () => {
  let component: BookEditComponent;
  let fixture: ComponentFixture<BookEditComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const bookServiceSpy = jasmine.createSpyObj('BookService', [
      'getBookById',
      'updateBook',
    ]);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'error',
      'success',
    ]);

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      paramMap: of(new Map([['id', '1']])),
      params: { id: '1' },
      queryParams: {},
      fragment: null,
    });

    // Mock du service BookService
    bookServiceSpy.getBookById.and.returnValue(
      of({
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        type: 'BOOK',
        description: 'Test description',
      })
    );

    await TestBed.configureTestingModule({
      imports: [
        BookEditComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
      ],
      providers: [
        FormBuilder,
        { provide: Router, useValue: routerSpyObj },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: BookService, useValue: bookServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();

    fixture = TestBed.createComponent(BookEditComponent);
    component = fixture.componentInstance;

    // Mock user admin pour éviter la redirection
    component['authService'].currentUser$ = of({
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });

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

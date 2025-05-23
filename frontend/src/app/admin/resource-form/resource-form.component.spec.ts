import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceFormComponent } from './resource-form.component';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ResourceFormComponent', () => {
  let component: ResourceFormComponent;
  let fixture: ComponentFixture<ResourceFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const activatedRouteSpy = jasmine.createSpyObj(
      'ActivatedRoute',
      ['snapshot'],
      {
        params: {},
        queryParams: {},
        fragment: null,
      }
    );

    await TestBed.configureTestingModule({
      imports: [
        ResourceFormComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: Router, useValue: routerSpyObj },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();

    fixture = TestBed.createComponent(ResourceFormComponent);
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

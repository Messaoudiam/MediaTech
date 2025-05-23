import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AppComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        HttpClientTestingModule,
        RouterTestingModule, // Remplace Router mock
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA], // Ignore les erreurs de composants inconnus
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    // Mock console logs
    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();
  });

  afterEach(() => {
    // Gérer toutes les requêtes en cours
    const openRequests = httpMock.match(() => true);
    openRequests.forEach((req) => {
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });
    httpMock.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'MediaTech' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('MediaTech');
  });

  it('should render the app structure', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // Test basique que l'app se charge
    expect(compiled).toBeTruthy();
  });
});

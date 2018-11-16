import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AppConfig } from '../environments/environment';
import { AppComponent } from './app.component';
import { ElectronService } from './providers/electron.service';
import { UpdateService } from './providers/update.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let de: DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: AppComponent },
          { path: 'update-launcher', component: AppComponent },
        ]),
      ],
      providers: [
        ElectronService,
        {
          provide: UpdateService,
          useValue: { getLauncherUpdateRequired: () => of(true) },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});

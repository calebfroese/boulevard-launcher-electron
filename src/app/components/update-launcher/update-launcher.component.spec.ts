import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateLauncherComponent } from './update-launcher.component';

describe('UpdateLauncherComponent', () => {
  let component: UpdateLauncherComponent;
  let fixture: ComponentFixture<UpdateLauncherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateLauncherComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateLauncherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain an update link', async(() => {
    expect(fixture.debugElement.nativeElement.textContent).toContain(
      'https://boulevard.calebfroese.com'
    );
  }));

  it('should notify the user to update the launcher', async(() => {
    expect(fixture.debugElement.nativeElement.textContent).toContain(
      'Please update the launcher'
    );
  }));
});

import { Component, NgZone, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../../../environments/environment';
import { UpdateService } from '../../providers/update.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  releaseNotes$: Observable<string>;
  status$: Observable<string>;
  updateRequired$: Observable<boolean>;
  latestGameVersion$: Observable<string>;
  installedGameVersion$: Observable<string>;
  // Download
  progress$: Observable<number>;
  progressPercent$: Observable<string>;

  launcherVersion = AppConfig.launcherVersion;

  constructor(public updateService: UpdateService, public zone: NgZone) {}

  ngOnInit() {
    this.releaseNotes$ = this.updateService.getReleaseNotes();
    this.status$ = this.updateService.getStatus();
    this.progress$ = this.updateService.getProgress();
    this.latestGameVersion$ = this.updateService.getLatestGameVersion();
    this.progressPercent$ = this.updateService
      .getProgress()
      .pipe(map(progress => Math.floor(progress) + '%'));
  }

  update() {
    this.updateService.update();
  }

  play() {}
}

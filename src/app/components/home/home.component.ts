import {
  animate,
  group,
  keyframes,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, NgZone, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../../../environments/environment';
import { UpdateService } from '../../providers/update.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('popIn', [
      transition(':enter', [
        group([
          query(':self', [
            animate(
              '0.2s ease-out',
              keyframes([
                style({ transform: 'scale(0.8)' }),
                style({ transform: 'scale(1.2)' }),
                style({ transform: 'scale(1)' }),
              ])
            ),
          ]),
        ]),
      ]),
    ]),
    trigger('fadeUp', [
      transition(':enter', [
        group([
          query(':self', [
            animate(
              '1s ease-in-out',
              keyframes([
                style({ opacity: 0, transform: 'translateY(4px)' }),
                style({ opacity: 1, transform: 'translateY(0)' }),
              ])
            ),
          ]),
        ]),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit {
  releaseNotes$: Observable<string>;
  log$: Observable<string>;
  status$: Observable<string>;
  updateRequired$: Observable<boolean>;
  latestGameVersion$: Observable<string>;
  // Download
  progress$: Observable<number>;
  progressPercent$: Observable<string>;

  launcherVersion = AppConfig.launcherVersion;

  constructor(public updateService: UpdateService, public zone: NgZone) {}

  ngOnInit() {
    this.releaseNotes$ = this.updateService.getReleaseNotes();
    this.status$ = this.updateService.getStatus();
    this.log$ = this.updateService.getLog();
    this.progress$ = this.updateService.getProgress();
    this.latestGameVersion$ = this.updateService.getLatestGameVersion();
    this.progressPercent$ = this.updateService
      .getProgress()
      .pipe(map(progress => Math.floor(progress) + '%'));
  }

  update() {
    this.updateService.update();
  }

  play() {
    this.updateService.launchGame();
  }
}

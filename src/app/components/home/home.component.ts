import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfig } from '../../../environments/environment';
import { UpdateService } from '../../providers/update.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  releaseNotes$: Observable<string>;
  latestGameVersion$: Observable<string>;

  launcherVersion = AppConfig.launcherVersion;

  constructor(public updateService: UpdateService) {}

  ngOnInit() {
    this.releaseNotes$ = this.updateService.getReleaseNotes();
    this.latestGameVersion$ = this.updateService.getLatestGameVersion();
  }
}

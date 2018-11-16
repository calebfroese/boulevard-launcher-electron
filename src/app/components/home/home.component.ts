import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfig } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  releaseNotes$: Observable<string>;

  launcherVersion = AppConfig.launcherVersion;

  constructor(public http: HttpClient) {}

  ngOnInit() {
    this.releaseNotes$ = this.http.get(AppConfig.releaseNotesUrl, {
      responseType: 'text',
    });
  }
}

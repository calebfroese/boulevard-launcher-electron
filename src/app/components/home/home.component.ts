import { Component, OnInit } from '@angular/core';

import { AppConfig } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  launcherVersion = AppConfig.launcherVersion;
  ngOnInit() {}
}

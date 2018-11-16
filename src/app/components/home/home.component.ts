import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { UpdateService } from '../../providers/update.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  ngOnInit() {
  }
}

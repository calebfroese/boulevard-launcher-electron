import { Component, OnInit } from '@angular/core';
import { UpdateService } from '../providers/update.service';
import { Router } from '@angular/router';
import {
  animate,
  group,
  keyframes,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  animations: [
    trigger('reveal', [
      transition(':enter', [
        group([
          query(':self', [
            animate(
              '1s ease-out',
              keyframes([style({ opacity: 1 }), style({ opacity: 0 })])
            ),
          ]),
        ]),
      ]),
    ]),
  ],
})
export class LoadingComponent implements OnInit {
  constructor(public updateService: UpdateService, public router: Router) {}

  ngOnInit() {
    this.updateService.getLauncherUpdateRequired().subscribe(updateRequired => {
      if (updateRequired) {
        this.router.navigate(['/', 'update-launcher']);
      } else {
        this.router.navigate(['/', 'home']);
      }
    });
  }
}

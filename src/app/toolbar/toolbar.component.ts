import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {
  @Output() minimize = new EventEmitter();
  @Output() close = new EventEmitter();

  onMinimize() {
    this.minimize.emit();
  }

  onClose() {
    this.close.emit();
  }
}

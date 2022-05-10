import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './child.component.html',
})
export class ChildComponent {
  public readonly href: string;
  constructor() {
    const base =
      document.head.querySelector('base')?.href ?? location.origin + '/';
    this.href = location.href.substring(base.length);
  }
}

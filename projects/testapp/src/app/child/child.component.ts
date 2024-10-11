import { Component } from '@angular/core';
import { CounterComponent } from '../counter/counter.component';

@Component({
    selector: 'app-root',
    templateUrl: './child.component.html',
    standalone: true,
    imports: [CounterComponent],
})
export class ChildComponent {
  public readonly href: string;
  constructor() {
    const base =
      document.head.querySelector('base')?.href ?? location.origin + '/';
    this.href = location.href.substring(base.length);
  }
}

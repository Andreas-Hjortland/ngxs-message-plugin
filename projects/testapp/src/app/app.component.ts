import { Component, HostListener } from '@angular/core';
import { MessagePortService } from 'ngxs-message-plugin';
import { CounterComponent } from './counter/counter.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: true,
    imports: [CounterComponent],
})
export class AppComponent {
  title = 'testapp';

  constructor(private readonly msgService: MessagePortService) {}

  @HostListener('window:beforeunload') beforeUnload() {
    for (const source of this.msgService.eventSources) {
      (source as Window).close?.();
    }
  }

  openPopup() {
    window.open('popup', 'popup', 'width=400,height=400');
  }
}

import { Component, HostListener } from '@angular/core';
import { MessagePortService } from 'ngxs-message-plugin';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'testapp';

  constructor(private readonly msgService: MessagePortService) {
    setInterval(() => {
      console.log([...this.msgService.eventSources]);
    }, 1000);
  }

  @HostListener('window:beforeunload') beforeUnload() {
    for (const source of this.msgService.eventSources) {
      (source as Window).close?.();
    }
  }

  openPopup() {
    window.open('popup', 'popup', 'width=400,height=400');
  }
}

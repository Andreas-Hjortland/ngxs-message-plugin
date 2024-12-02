import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { withNgxsMessagePlugin } from 'ngxs-message-plugin';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';

if (environment.production) {
  enableProdMode();
}

function startsWith(prefix: string) {
  return location.href.startsWith(document.baseURI + prefix);
}

async function launch() {
  try {
    if (startsWith('popup') || startsWith('iframe')) {
      const { ChildComponent } = await import('./app/child/child.component');
      await bootstrapApplication(ChildComponent, {
        ...appConfig,
        providers: [
          ...appConfig.providers,
          withNgxsMessagePlugin(false)
        ]
      });
    } else {
      const { AppComponent } = await import('./app/app.component');
      await bootstrapApplication(AppComponent, {
        ...appConfig,
        providers: [
          ...appConfig.providers,
          withNgxsMessagePlugin(true, {
            debounce: 0,
          })
        ],
      });
    }
  } catch (err) {
    console.error(err);
  }
}

launch();
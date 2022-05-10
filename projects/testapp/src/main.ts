import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

function startsWith(prefix: string) {
  const base =
    document.head.querySelector('base')?.href ?? location.origin + '/';
  return location.href.startsWith(base + prefix);
}

if (startsWith('popup')) {
  import('./app/popup/popup.module')
    .then(({ PopupModule }) =>
      platformBrowserDynamic().bootstrapModule(PopupModule)
    )
    .catch((err) => console.error(err));
} else {
  import('./app/app.module')
    .then(({ AppModule }) =>
      platformBrowserDynamic().bootstrapModule(AppModule)
    )
    .catch((err) => console.error(err));
}

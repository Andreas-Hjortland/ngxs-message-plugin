import { enableProdMode, importProvidersFrom } from '@angular/core';

import { environment } from './environments/environment';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsMessagePluginModule } from 'ngxs-message-plugin';
import { CounterState } from './app/counter/counter.state';
import { NgxsModule } from '@ngxs/store';
import { CounterModule } from './app/counter/counter.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';

if (environment.production) {
  enableProdMode();
}

function startsWith(prefix: string) {
  return location.href.startsWith(document.baseURI + prefix);
}

async function launch() {
  const commonModules = [
    BrowserModule,
    CounterModule,
    NgxsModule.forRoot([CounterState], {
      developmentMode: !environment.production,
    }),
    NgxsReduxDevtoolsPluginModule.forRoot(),
  ];
  try {
    if (startsWith('popup') || startsWith('iframe')) {
      const { ChildComponent } = await import('./app/child/child.component');
      await bootstrapApplication(ChildComponent, {
        providers: [
          importProvidersFrom(
            ...commonModules,
            NgxsMessagePluginModule.forChild(),
            
          ),
        ],
      });
    } else {
      const { AppComponent } = await import('./app/app.component');
      await bootstrapApplication(AppComponent, {
        providers: [
          importProvidersFrom(
            ...commonModules,
            NgxsMessagePluginModule.forRoot({
              debounce: 0,
            }),
          ),
        ],
      });
    }
  } catch (err) {
    console.error(err);
  }
}

launch();
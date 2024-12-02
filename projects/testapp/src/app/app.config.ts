import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { withNgxsReduxDevtoolsPlugin } from '@ngxs/devtools-plugin';
import { provideStore } from '@ngxs/store';
import { CounterState, Decrement, Increment } from './counter/counter.state';
import { KNOWN_ACTIONS } from 'ngxs-message-plugin';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideStore(
      [CounterState],
      withNgxsReduxDevtoolsPlugin(),
    ),
    {
      provide: KNOWN_ACTIONS,
      useValue: [Increment, Decrement],
      multi: true,
    }
  ],
};

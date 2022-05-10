import { NgModule } from '@angular/core';
import { PopupComponent } from './popup.component';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { CounterState } from '../counter/counter.state';
import { NgxsMessagePluginModule } from 'ngxs-message-plugin';
import { CounterModule } from '../counter/counter.module';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@NgModule({
  declarations: [PopupComponent],
  imports: [
    BrowserModule,
    CounterModule,
    NgxsModule.forRoot([CounterState], {
      developmentMode: !environment.production,
    }),
    NgxsMessagePluginModule.forChild(),
    NgxsReduxDevtoolsPluginModule.forRoot(),
  ],
  bootstrap: [PopupComponent],
})
export class PopupModule {}

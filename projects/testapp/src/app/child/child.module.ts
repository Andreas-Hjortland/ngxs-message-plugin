import { NgModule } from '@angular/core';
import { ChildComponent } from './child.component';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { CounterState } from '../counter/counter.state';
import { NgxsMessagePluginModule } from 'ngxs-message-plugin';
import { CounterModule } from '../counter/counter.module';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@NgModule({
  declarations: [ChildComponent],
  imports: [
    BrowserModule,
    CounterModule,
    NgxsModule.forRoot([CounterState], {
      developmentMode: !environment.production,
    }),
    NgxsMessagePluginModule.forChild(),
    NgxsReduxDevtoolsPluginModule.forRoot(),
  ],
  bootstrap: [ChildComponent],
})
export class PopupModule {}

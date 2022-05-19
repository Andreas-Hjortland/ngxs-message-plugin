import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsMessagePluginModule } from 'ngxs-message-plugin';
import { environment } from '../../environments/environment';
import { CounterModule } from '../counter/counter.module';
import { CounterState } from '../counter/counter.state';
import { ChildComponent } from './child.component';

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

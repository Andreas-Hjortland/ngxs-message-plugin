import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounterComponent } from './counter.component';
import { KNOWN_ACTIONS } from 'ngxs-message-plugin';
import { Decrement, Increment } from './counter.state';

@NgModule({
    imports: [CommonModule, CounterComponent],
    exports: [CounterComponent],
    providers: [
        {
            provide: KNOWN_ACTIONS,
            useValue: [Increment, Decrement],
            multi: true,
        },
    ],
})
export class CounterModule {}

import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { CounterState, Decrement, Increment } from './counter.state';
import { AsyncPipe } from '@angular/common';
import { KNOWN_ACTIONS } from 'ngxs-message-plugin';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.css'],
  standalone: true,
})
export class CounterComponent {
  public readonly count = this.store.selectSignal(CounterState.count);

  constructor(private readonly store: Store) {}

  increment() {
    this.store.dispatch(new Increment());
  }

  decrement() {
    this.store.dispatch(new Decrement());
  }
}

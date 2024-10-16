import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { CounterState, Decrement, Increment } from './counter.state';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-counter',
    templateUrl: './counter.component.html',
    styleUrls: ['./counter.component.css'],
    standalone: true,
    imports: [AsyncPipe],
})
export class CounterComponent {
  @Select(CounterState)
  count$!: Observable<number>;

  constructor(private readonly store: Store) {}

  increment() {
    this.store.dispatch(new Increment());
  }

  decrement() {
    this.store.dispatch(new Decrement());
  }
}

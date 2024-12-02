import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

export type CounterModel = number;

export class Increment {
  static readonly type = '[Counter] Increment';
}

export class Decrement {
  static readonly type = '[Counter] Decrement';
}

@State<CounterModel>({
  name: 'counter',
  defaults: 0,
})
@Injectable()
export class CounterState {
  @Selector()
  static count(state: CounterModel) {
    return state;
  }
  
  @Action([Increment, Decrement])
  public change(
    ctx: StateContext<CounterModel>,
    action: Increment | Decrement
  ) {
    if (action instanceof Increment) {
      ctx.setState(ctx.getState() + 1);
    } else if (action instanceof Decrement) {
      ctx.setState(ctx.getState() - 1);
    }
  }
}

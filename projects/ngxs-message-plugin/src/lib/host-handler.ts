import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import { Store } from '@ngxs/store';
import { ActionDef } from '@ngxs/store/src/actions/symbols';
import { debounceTime, filter, map, Observable, Subscription, tap } from 'rxjs';
import { getDiff } from './diff';
import {
  ACTION_DISPATCHED,
  DEBOUNCE_TIME,
  Filter,
  GET_STORE,
  KNOWN_ACTIONS,
  MessageCommunicationService,
  STATE_FILTER,
  STORE_INIT,
  STORE_UPDATE,
} from './symbols';

@Injectable()
export class HostHandler implements OnDestroy {
  private readonly subscriptions: Subscription[] = [];
  private readonly knownActions: Map<string, ActionDef>;

  constructor(
    private readonly store: Store,
    private readonly commsService: MessageCommunicationService,
    @Inject(STATE_FILTER) @Optional() private readonly stateFilter: Filter | undefined,
    @Inject(KNOWN_ACTIONS) @Optional() knownActions: ActionDef[],
    @Inject(DEBOUNCE_TIME) @Optional() private readonly debounce: number | undefined,
  ) {
    this.debounce ??= 100;
    this.knownActions = new Map(
      knownActions
        ?.flat()
        .map((actionConstructor) => [actionConstructor.type, actionConstructor])
    );
  }

  private filterState(state: any): any {
    if (typeof this.stateFilter === 'function') {
      return this.stateFilter(state);
    }
    if (this.stateFilter instanceof RegExp) {
      const filter = this.stateFilter;
      return Object.fromEntries(
        Object.entries(state).filter(([key]) => filter.test(key))
      );
    }
    return state;
  }

  public init = () => {
    console.log('HostHandler init()');
    if (this.subscriptions.length) {
      console.warn('HostHandler is already initiated, will re-initiate');
      while (this.subscriptions.length) {
        this.subscriptions.pop()?.unsubscribe();
      }
    }
    this.subscriptions.push(
      this.commsService.messages$.subscribe((msg) => {
        switch (msg.type) {
          case ACTION_DISPATCHED:
            this.onActionDispatched(msg.actionType, msg.action);
            break;
          case GET_STORE:
            this.onGetStore();
            break;
        }
      })
    );
    let oldState: any = undefined;
    const obs = new Observable((subscriber) => {
      const storeSub = this.store.subscribe((nextState) => {
        subscriber.next(nextState);
      });
      return () => storeSub.unsubscribe();
    });
    this.subscriptions.push(
      obs.pipe(
        this.debounce ? debounceTime(this.debounce) : tap(() => {}),
        map(nextState => this.filterState(nextState)),
        map(nextState => {
          const diff = Array.from(getDiff(oldState, nextState));
          oldState = nextState;
          return diff;
        }),
        filter(diff => diff.length > 0),
      ).subscribe(diff => {
        this.commsService.postMessage({
          type: STORE_UPDATE,
          payload: diff,
        });
      })
    );
  };

  private onGetStore(): void {
    this.commsService.postMessage({
      type: STORE_INIT,
      payload: this.filterState(this.store.snapshot()),
    });
  }

  private onActionDispatched(
    actionType: string | undefined,
    action: any
  ): void {
    if (actionType) {
      const actionConstructor = this.knownActions.get(actionType);
      const constructedAction = actionConstructor
        ? Object.create(actionConstructor.prototype)
        : new (class MessageAction {
          static readonly type = actionType;
        })();
      this.store.dispatch(Object.assign(constructedAction, action));
    } else {
      this.store.dispatch(action);
    }
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}

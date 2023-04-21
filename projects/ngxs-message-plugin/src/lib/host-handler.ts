import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import { Store } from '@ngxs/store';
import { ActionDef } from '@ngxs/store/src/actions/symbols';
import { Subscription } from 'rxjs';
import {
  ACTION_DISPATCHED,
  Filter,
  GET_STORE,
  KNOWN_ACTIONS,
  MessageCommunicationService,
  STATE_FILTER,
  STORE_UPDATE,
} from './symbols';

@Injectable()
export class HostHandler implements OnDestroy {
  private readonly subscriptions: Subscription[] = [];
  private readonly knownActions: Map<string, ActionDef>;

  constructor(
    private readonly store: Store,
    private readonly commsService: MessageCommunicationService,
    @Inject(STATE_FILTER)
    @Optional()
    private readonly stateFilter: Filter | undefined,
    @Inject(KNOWN_ACTIONS) @Optional() knownActions: ActionDef[]
  ) {
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
    this.subscriptions.push(
      this.store.subscribe((nextState) => {
        this.commsService.postMessage({
          type: STORE_UPDATE,
          payload: this.filterState(nextState),
        });
      })
    );
  };

  private onGetStore(): void {
    this.commsService.postMessage({
      type: STORE_UPDATE,
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

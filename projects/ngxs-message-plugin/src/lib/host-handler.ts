import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import { NgxsNextPluginFn, NgxsPlugin, Store } from '@ngxs/store';
import { ActionDef } from '@ngxs/store/src/actions/symbols';
import { Observable, Subscription, tap } from 'rxjs';
import {
  ACTION_DISPATCHED,
  GET_STORE,
  KNOWN_ACTIONS,
  MessageCommunicationService,
  STORE_UPDATE,
} from './symbols';

@Injectable()
export class HostHandler implements OnDestroy {
  private subscription!: Subscription;
  private knownActions: Map<string, ActionDef>;

  constructor(
    private store: Store,
    private commsService: MessageCommunicationService,
    @Inject(KNOWN_ACTIONS) @Optional() knownActions: ActionDef[]
  ) {
    this.knownActions = new Map(
      knownActions
        ?.flat()
        .map((actionConstructor) => [actionConstructor.type, actionConstructor])
    );
  }

  public init = () => {
    this.subscription = this.commsService.messages$.subscribe((msg) => {
      switch (msg.type) {
        case ACTION_DISPATCHED:
          this.onActionDispatched(msg.actionType, msg.action);
          break;
        case GET_STORE:
          this.onGetStore();
          break;
      }
    });
  };

  private onGetStore(): void {
    this.commsService.postMessage({
      type: STORE_UPDATE,
      actionType: undefined,
      payload: this.store.snapshot(),
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
    this.subscription.unsubscribe();
  }
}

@Injectable()
export class HostPlugin implements NgxsPlugin {
  constructor(private commsService: MessageCommunicationService) {}

  handle(state: any, action: any, next: NgxsNextPluginFn): Observable<void> {
    return next(state, action).pipe(
      tap((nextState) => {
        this.commsService.postMessage({
          type: STORE_UPDATE,
          actionType: action.type ?? action.constructor?.type,
          payload: nextState,
        });
      })
    );
  }
}

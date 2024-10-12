import { Injectable, OnDestroy } from '@angular/core';
import { InitState, NgxsNextPluginFn, NgxsPlugin, Store } from '@ngxs/store';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { ACTION_DISPATCHED, GET_STORE, MessageCommunicationService, STORE_INIT, STORE_UPDATE } from './symbols';
import { deepMerge } from './utils';
import { applyDiff, Diff } from './diff';

class Message {
    static readonly type = '@@MESSAGE' as const;

    constructor(public payload: Diff[]) { }
}

class InitMessage {
    static readonly type = '@@INIT_MESSAGE' as const;

    constructor(public payload: any) { }
}

/**
 * Subscribes to messages and dispatches events to the store to be caught by 
 * `ChildPlugin`
 */
@Injectable()
export class ChildHandler implements OnDestroy {
    private subscription!: Subscription;

    constructor(
        private commsService: MessageCommunicationService,
        private store: Store,
    ) { }

    /**
     * Call this method to start listening to events and post the initial
     * handshake message.
     */
    public init = () => {
        console.log('ChildHandler init()');
        if (this.subscription) {
            console.warn('ChildHandler is already initiated, will re-initiate');
            this.subscription.unsubscribe();
        }
        this.subscription = this.commsService.messages$.subscribe(msg => {
            if (msg.type === STORE_UPDATE) {
                this.store.dispatch(new Message(msg.payload));
            } else if(msg.type === STORE_INIT) {
                this.store.dispatch(new InitMessage(msg.payload));
            }
        });
        this.commsService.postMessage({ type: GET_STORE });
    };

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
}

/**
 * This takes every event and serializes them to be posted to the host state
 * When we get an Action of type `Message` we will do a deep merge with the 
 * current state and return that, otherwise we will swallow the action so that 
 * the state is not modified.
 */
@Injectable()
export class ChildPlugin implements NgxsPlugin {
    constructor(
        private commsService: MessageCommunicationService,
    ) { }

    handle(state: any, action: any, next: NgxsNextPluginFn): Observable<void> {
        if (action instanceof InitState) {
            return next(state, action);
        } else if (action instanceof Message) {
            if (action.payload.length > 0) {
                const result = applyDiff(state, action.payload);
                return next(result, action);
            }
        } else if (action instanceof InitMessage) {
            return next(action.payload, action); // TODO: May use deepMerge here
        } else {
            this.commsService.postMessage({
                type: ACTION_DISPATCHED,
                actionType: action.constructor?.type,
                action,
            });
        }
        return EMPTY;
    }
}

import { Injectable, OnDestroy } from '@angular/core';
import { InitState, NgxsNextPluginFn, NgxsPlugin, Store } from '@ngxs/store';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { ACTION_DISPATCHED, GET_STORE, MessageCommunicationService, STORE_UPDATE } from './symbols';
import { deepMerge } from './utils';

class Message {
    get type(): string {
        const baseType = '@@MESSAGE';
        if (this.parentType) {
            return `${baseType}: ${this.parentType}`;
        }
        return baseType;
    }
    constructor(public payload: any, public parentType: string | undefined) { }
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
        if(this.subscription) {
            console.warn('ChildHandler is already initiated, will re-initiate');
            this.subscription.unsubscribe();
        }
        this.subscription = this.commsService.messages$.subscribe(msg => {
            if (msg.type === STORE_UPDATE) {
                this.store.dispatch(new Message(msg.payload, msg.actionType));
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
            const { result, equal } = deepMerge(state, action.payload);
            if (!equal) {
                return next(result, action);
            }
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

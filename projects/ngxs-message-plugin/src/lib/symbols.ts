import { InjectionToken, Provider } from '@angular/core';
import { ActionDef } from '@ngxs/store/src/actions/symbols';
import { Observable } from 'rxjs';

export const GET_STORE = 'GET_STORE' as const;
export const STORE_UPDATE = 'STORE_UPATE' as const;
export const ACTION_DISPATCHED = 'ACTION_DISPATCHED' as const;

/**
 * The message format. Should not be relied upon externally
 * @private
 */
export type Message =
  | {
      type: typeof STORE_UPDATE;
      payload: any;
    }
  | {
      type: typeof ACTION_DISPATCHED;
      actionType?: string;
      action: any;
    }
  | {
      type: typeof GET_STORE;
    };

export type Config = {
  /**
   * Which message handler to use. 'port' is default if no other is selected
   * - `port` will use `MessageChannel` and by default the `forChild`
   *   instances will send a message to `window.opener` or `window.parent`
   *   (whichever is present) and initiate contact with the `forRoot` frame in
   *   a one-to-one relationship.
   * - `broadcast` will use a `BroadcastChannel` so that we synchronize state
   *   between all instances on the same origin if you use this, you must be
   *   carefull to avoid having a multi master setup where we have two
   *   instances of the app running with `forRoot`. You can also provide your
   *   own provider if you want to handle communication yourself
   */
  messageHandler?: Provider | 'broadcast' | 'port';

  /**
   * name of the broadcast channel if you use the `broadcast` message handler
   */
  broadcastChannelName?: string;

  /**
   * Trusted origins if you use the `port` message handler. Note that we only
   * support a single origin for child states.
   */
  origin?: string | string[];

  /**
   * Known actions. We use this to map prototypes if you use `instanceof` in
   * your reducers. You can either supply them in this array or use the
   * `KNOWN_ACTIONS` injection token to supply them if you want to do so
   * dynamically. This is only applicable for the host config
   */
  knownActions?: ActionDef[];
};

/**
 * Channel name for the `BroadcastChannel` only applicable for the 'broadcast'
 * communication strategy if you want to have multiple root instances.
 */
export const BROADCAST_CHANNEL_NAME = new InjectionToken<string>(
  'BROADCAST_CHANNEL_NAME'
);

/**
 * Communication service. Could be an interface, but is a class so that it can
 * be used as an injection token
 */
export abstract class MessageCommunicationService {
  public abstract readonly messages$: Observable<Message>;
  public abstract postMessage(message: Message): void;
}

/**
 * Which origins that are allowed to share state. Only applicable for the 'port'
 * communication type
 */
export const ALLOWED_ORIGIN = new InjectionToken<string | string[]>(
  'ALLOWED_ORIGIN'
);

/**
 * Known actions. Used to map prototypes to objects after deserialization
 */
export const KNOWN_ACTIONS = new InjectionToken<ActionDef[] | ActionDef>(
  'KNOWN_ACTION'
);

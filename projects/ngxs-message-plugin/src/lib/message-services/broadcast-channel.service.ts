import { Inject, Injectable } from '@angular/core';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { BROADCAST_CHANNEL_NAME, Message, MessageCommunicationService } from '../symbols';
import { isMessageType } from '../utils';

/**
 * `BroadcastChannel` implemenation of the message service. Will broadcast every
 * message and pipe messages from other instances back to the listeners.
 */
@Injectable()
export class BroadcastChannelService implements MessageCommunicationService {
    private readonly channel: BroadcastChannel;
    public readonly messages$: Observable<Message>;

    constructor(@Inject(BROADCAST_CHANNEL_NAME) channelName: string) {
        this.channel = new BroadcastChannel(channelName);
        this.messages$ = fromEvent<MessageEvent>(this.channel, 'message').pipe(
            filter(isMessageType),
            map(evt => evt.data),
        );
    }

    public postMessage(message: Message): void {
        this.channel.postMessage(message);
    }
}

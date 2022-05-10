import { EventEmitter, Inject, Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ALLOWED_ORIGIN, Message, MessageCommunicationService } from '../symbols';
import { isMessageType } from '../utils';

const SETUP_MESSAGE = 'PORT_SETUP' as const;
const TEARDOWN_MESSAGE = 'PORT_TEARDOWN' as const;

/**
 * The generic Message port service. You can use this to manually add and 
 * remove message channels to the communication plugin.
 */
@Injectable()
export class MessagePortService implements MessageCommunicationService, OnDestroy {
    private readonly $messages = new Subject<Message>();
    private readonly ports = new Map<MessagePort, MessageEventSource>();

    /**
     * @internal Messages that are sent to this service
     */
    public readonly messages$ = this.$messages.asObservable();

    /**
     * This event emitter will emit whenever we add or remove a source
     */
    public readonly eventSourcesChanged = new EventEmitter<void>();

    /**
     * Event sources. This will be a list of all popups, frames and workers that
     * are connected to this service. May be used to close popups when the main
     * frame is closed or to detect when external window is closed to reattach
     * the content to the main window
     */
    public get eventSources() { return this.ports.values(); }

    constructor() {
        window.addEventListener('beforeunload', () => this.ngOnDestroy());
    }

    /**
     * Attach listeners and post messages to a new port
     * 
     * @param port The message port to listen and post events to
     * @param source The Message source. Only use is to populate `eventSources`.
     */
    public addPort(port: MessagePort, source: MessageEventSource) {
        this.ports.set(port, source);
        this.eventSourcesChanged.emit();

        port.addEventListener('message', this.handleMessage);
        port.start();
    }

    /**
     * Remove listeners and stop posting messages to the port
     * 
     * @param port The message port to listen and post events to
     * @param remove Set to `false` if you are disposing of the message port 
     *               service and want to remove every every port in an iteration
     *               of the eventSources
     */
    public removePort(port: MessagePort, remove: boolean = true) {
        port.postMessage(TEARDOWN_MESSAGE);
        port.removeEventListener('message', this.handleMessage);
        port.close();
        if (remove) {
            this.ports.delete(port);
            this.eventSourcesChanged.emit();
        }
    }

    private handleMessage = (evt: MessageEvent): void => {
        if (evt.data === TEARDOWN_MESSAGE) {
            const port = evt.source as MessagePort;
            this.ports.delete(port);
            port.removeEventListener('message', this.handleMessage);
            port.close();
        } else if (isMessageType(evt)) {
            this.$messages.next(evt.data);
        }
    };

    ngOnDestroy(): void {
        for (const port of this.ports.keys()) {
            this.removePort(port, false);
        }
        this.ports.clear();
        this.$messages.complete();
    }

    public postMessage(message: Message): void {
        for (const port of this.ports.keys()) {
            port.postMessage(message);
        }
    }
}

@Injectable()
export class ChildMessagePortService extends MessagePortService {
    constructor(@Inject(ALLOWED_ORIGIN) allowedOrigin: string) {
        super();
        allowedOrigin ??= location.origin;

        const channel = new MessageChannel();
        if (window.opener) {
            this.addPort(channel.port1, window.opener);
            window.opener.postMessage(SETUP_MESSAGE, allowedOrigin, [channel.port2]);
        } else if (window.parent !== window) {
            this.addPort(channel.port1, window.parent);
            window.parent.postMessage(SETUP_MESSAGE, allowedOrigin, [channel.port2]);
        } else {
            throw new Error('Unable to connect to store host');
        }
    }
}

@Injectable()
export class HostMessagePortService extends MessagePortService {
    constructor(@Inject(ALLOWED_ORIGIN) allowedOrigins: string | string[] | null) {
        super();
        allowedOrigins ??= location.origin;

        const originSet = new Set(typeof allowedOrigins === 'string' ? [allowedOrigins] : allowedOrigins.flat());
        window.addEventListener('message', evt => {
            if (!originSet.has('*') && !originSet.has(evt.origin)) return;
            if (evt.data === SETUP_MESSAGE) {
                this.addPort(evt.ports[0], evt.source!);
            }
        });
    }
}
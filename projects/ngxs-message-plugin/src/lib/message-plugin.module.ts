import {
  ModuleWithProviders,
  NgModule,
  Optional,
  Provider,
} from '@angular/core';
import { NGXS_PLUGINS } from '@ngxs/store';
import { ChildHandler, ChildPlugin } from './child-handler';
import { HostHandler } from './host-handler';
import { BroadcastChannelService } from './message-services/broadcast-channel.service';
import {
  ChildMessagePortService,
  HostMessagePortService,
  MessagePortService,
} from './message-services/message-port.service';
import {
  ALLOWED_ORIGIN,
  BROADCAST_CHANNEL_NAME,
  Config,
  KNOWN_ACTIONS,
  MessageCommunicationService,
  STATE_FILTER,
} from './symbols';

function createModule(
  isHost: boolean,
  config?: Config
): ModuleWithProviders<NgxsMessagePluginModule> {
  const providers: Provider[] = [];
  if (isHost) {
    providers.push(HostHandler);
    if (config?.filter) {
      providers.push({
        provide: STATE_FILTER,
        useValue: config.filter,
      });
    }
  } else {
    providers.push(ChildHandler, {
      provide: NGXS_PLUGINS,
      useClass: ChildPlugin,
      multi: true,
    });
  }

  if (config?.knownActions instanceof Array) {
    providers.push({
      provide: KNOWN_ACTIONS,
      useValue: config.knownActions,
      multi: true,
    });
  }
  if (config?.messageHandler === 'broadcast') {
    providers.push(
      {
        provide: MessageCommunicationService,
        useClass: BroadcastChannelService,
      },
      {
        provide: BROADCAST_CHANNEL_NAME,
        useValue: config.broadcastChannelName ?? 'NGXS Messages',
      }
    );
  } else if (
    typeof config?.messageHandler === 'undefined' ||
    config.messageHandler === 'port'
  ) {
    providers.push(
      {
        provide: MessagePortService,
        useClass: isHost ? HostMessagePortService : ChildMessagePortService,
      },
      {
        provide: MessageCommunicationService,
        useExisting: MessagePortService,
      }
    );
    if (config?.origin) {
      providers.push({
        provide: ALLOWED_ORIGIN,
        useValue: config.origin,
      });
    }
  } else {
    providers.push({
      provide: MessageCommunicationService,
      useExisting: config.messageHandler,
    });
  }

  const result: ModuleWithProviders<NgxsMessagePluginModule> = {
    ngModule: NgxsMessagePluginModule,
    providers,
  };
  return result;
}

@NgModule()
export class NgxsMessagePluginModule {
  /**
   * Use this for the pages that subscribes to the master store. Apps using this module will not run any reducers, but
   * defer to actions the root store page and patch the local state copy whenever the root state changes.
   */
  static forChild(
    config?: Omit<Config, 'knownActions'>
  ): ModuleWithProviders<NgxsMessagePluginModule> {
    return createModule(false, config);
  }

  /**
   * Use this for the page containing the root state - this will keep the source of truth and run reducers for any
   * actions that are posted to it
   */
  static forRoot(
    config?: Config
  ): ModuleWithProviders<NgxsMessagePluginModule> {
    return createModule(true, config);
  }

  constructor(
    @Optional() hostHandler?: HostHandler,
    @Optional() childHandler?: ChildHandler
  ) {
    hostHandler?.init() ?? childHandler?.init();
  }
}

import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  inject,
  Injector,
  makeEnvironmentProviders,
  ModuleWithProviders,
  NgModule,
  Optional,
  Provider,
  StaticProvider,
} from '@angular/core';
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
  DEBOUNCE_TIME,
  KNOWN_ACTIONS,
  MessageCommunicationService,
  STATE_FILTER,
} from './symbols';
import { withNgxsPlugin } from '@ngxs/store';

function getProviders(
  isHost: boolean,
  config?: Config
): (EnvironmentProviders | Provider)[] {
  const providers: (EnvironmentProviders | Provider)[] = [];
  if (isHost) {
    providers.push(HostHandler);
    if (config?.filter) {
      providers.push({
        provide: STATE_FILTER,
        useValue: config.filter,
      });
    }
    if (typeof config?.debounce === 'number' && config.debounce >= 0) {
      providers.push({
        provide: DEBOUNCE_TIME,
        useValue: config.debounce,
      });
    }
  } else {
    providers.push(ChildHandler);
    providers.push(withNgxsPlugin(ChildPlugin));
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
  return providers;
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
    return {
      ngModule: NgxsMessagePluginModule,
      providers: getProviders(false, config),
    };
  }

  /**
   * Use this for the page containing the root state - this will keep the source of truth and run reducers for any
   * actions that are posted to it
   */
  static forRoot(
    config?: Config
  ): ModuleWithProviders<NgxsMessagePluginModule> {
    return {
      ngModule: NgxsMessagePluginModule,
      providers: getProviders(true, config),
    };
  }

  constructor(
    @Optional() hostHandler?: HostHandler,
    @Optional() childHandler?: ChildHandler
  ) {
    hostHandler?.init();
    childHandler?.init();
  }
}

/**
 * Set up the plugin in angular standalone mode. Add in `provideStore` after root states and options (where other
 * plugins are added)
 *
 * @param isHost `true` if this is the root instance, `false` if this is a child instance
 * @param config Optional config for the storage plugin
 * @returns Providers to enable this plugin
 */
export function withNgxsMessagePlugin(
  isHost: boolean,
  config?: Config
): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...getProviders(isHost, config),
    {
      provide: ENVIRONMENT_INITIALIZER,
      useValue: () => {
        inject(HostHandler, { optional: true })?.init();
        inject(ChildHandler, { optional: true })?.init();
      },
      multi: true,
    },
  ]);
}

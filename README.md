# NgxsMessagePlugin

An Ngxs plugin that allows you to synchronize state across different browser contexts.

This allows you to use the same state in an iframe or popup window, and dispatch actions which will transparently run on
the state host and update every app that subscribes to the state. For instance this makes it easier to manage state
if you can detach elements from your app to a separate window.

Check out the sample app at https://andreas-hjortland.github.io/ngxs-message-plugin/ (or check out the source code in [projects/testapp](projects/testapp))

## Installation and usage

First you need to install the npm module:

```bash
npm install ngxs-message-plugin --save
```

Then you need to include the module in your host and child apps.

### Host

```ts
@NgModule({
    imports: [
        NgxsMessagePlugun.forRoot();
    ]
})
export class AppModule { }
```

### Child (popup / iframe)

```ts
@NgModule({
    imports: [
        NgxsMessagePlugun.forChild();
    ]
})
export class AppModule { }
```

You can then do `window.open('path/to/child/entrypoint')` and see that the state is the same in both the child and the
host state. You can also dispatch actions from the child state and they will be evaluated on the host store.

## Configuration

If you need to customize the module, the `forRoot` / `forChild` functions can take an optional configuration object. For
instance if you want to synchronize the state between all open windows on the origin, you can use the `BroadcastChannel`
message transport, or maybe you want to create your own message transport that uses web sockets to synchronize the state
with another browser alltogether. To configure the module, do like this

```ts
@NgModule({
    imports: [
        NgxsMessagePlugun.forRoot({
            messageHandler: 'broadcast',
            broadcastChannelName: 'myChannel', // this is what separates messages from different instances of the app
        });
    ]
})
export class AppModule { }
```

You can check out all the configuration options in [`symbols.ts`](projects/ngxs-message-plugin/src/lib/symbols.ts), but
the most important options are `messageHandler` which lets you configure how the messages are passed between instances.
The default is `port` which will register any popup window or frame that is opened on the same domain with the opener
state. You can also roll your own by providing an implementation of `MessageCommunicationService`.

## Test app

The test app is a simple demo app which highlights how to use the library and demos that both the state and actions are
transparently handled. Here you can also see that we are using the `KNOWN_ACTION` injection token to help the host
deserialize the actions since we are using `instanceof` in the [`counter.state.ts`](projects/testapp/src/app/counter/counter.state.ts)

To start the test app, just check out the project, install dependencies using `npm install` and start it using `npm run`

## Known issues, limitations and potential improvements

- If you are auto generating the action type names, you have to ensure that the action type name is the same on both the
  store owner and consumer.
  - For the ngxs emitter plugin, you will have to supply the action type in the `@Receiver` decorator.
- If you are relying on the `instanceof` operator in your reducers, you will have to register the action class with the
  `KNOWN_ACTION` injection token or through the `knownActions` configuration parameter on the host. This lets the plugin
  map actions from the clients so that we can re-apply the prototype after deserializing the objects
- We are serializing and copying the whole state for each state change and are doing the diff on the client. We probably
  could only send a diff from the host that we apply on the client. Feel free to create a pull request if you want to do
  this =)
- The state must be serializable and clonable using the structured clone algorithm. This is already best practice, but
  anything in the store not serializable will be ignored.
- On the children, you should not add any other plugins that modify the state because that might or might not be caught
  by the message plugin and therefore lost. That is not a problem on the host.

## Contributions

All contributions are welcome (both issues and pull requests) as long as we keep a civil tone :)

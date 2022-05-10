import { TestBed } from "@angular/core/testing";
import { Action, NgxsModule, NGXS_PLUGINS, State, StateContext, Store } from "@ngxs/store";
import { Subject } from "rxjs";
import { HostHandler, HostPlugin } from "./host-handler";
import { ACTION_DISPATCHED, GET_STORE, Message, MessageCommunicationService, STORE_UPDATE } from "./symbols";

class Foo {
  static readonly type = '[Test] Foo';

  constructor(public readonly foo: string) { }
}

type TestStateModel = {
  foo: string;
}

@State<TestStateModel>({
  name: 'test',
  defaults: {
    foo: ''
  }
})
export class TestState {
  @Action(Foo)
  foo(ctx: StateContext<TestStateModel>, action: Foo): void {
    ctx.setState({
      foo: action.foo
    });
  }
}


describe('HostFeatures', () => {
  let messages: Subject<Message>;
  let commsService: MessageCommunicationService;
  let hostHandler: HostHandler;
  let store: Store;

  beforeEach(() => {
    messages = new Subject();
    commsService = {
      messages$: messages.asObservable(),
      postMessage(msg) {
        console.log('Posting', msg);
      }
    };

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([TestState])
      ],
      providers: [
        HostHandler,
        HostPlugin,
        {
          provide: NGXS_PLUGINS,
          useClass: HostPlugin,
          multi: true,
        },
        {
          provide: MessageCommunicationService,
          useValue: commsService,
        }
      ]
    });

    store = TestBed.inject(Store);
    hostHandler = TestBed.inject(HostHandler);
    hostHandler.init();
  });

  describe('HostHandler', () => {
    it('should dispatch events from children', () => {
      spyOn(store, 'dispatch');
      const action = new Foo('bar');
      messages.next({
        type: ACTION_DISPATCHED,
        action: JSON.parse(JSON.stringify({
          type: Foo.type,
          ...action
        })),
      });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: Foo.type,
        ...action
      });
    });

    it('should return state when queried', () => {
      spyOn(commsService, 'postMessage');
      messages.next({ type: GET_STORE });

      expect(commsService.postMessage).toHaveBeenCalledOnceWith({
        type: STORE_UPDATE,
        actionType: undefined,
        payload: store.snapshot()
      });
    });
  });

  describe('HostPlugin', () => {
    it('should update clients after dispatch', done => {
      spyOn(commsService, 'postMessage');
      store.dispatch(new Foo('test')).subscribe(state => {
        expect(commsService.postMessage).toHaveBeenCalledOnceWith({
          type: STORE_UPDATE,
          actionType: Foo.type,
          payload: state
        });
        done();
      });
    });
  });

  it('should update the store', () => {
    expect(store.snapshot().test.foo).toBe('');
    const payload = {
      test: {
        foo: 'bar',
      }
    };
    messages.next({
      type: ACTION_DISPATCHED,
      action: JSON.parse(JSON.stringify(new Foo('bar'))),
      actionType: Foo.type
    });
    expect(store.snapshot()).toEqual(payload);
  });
});

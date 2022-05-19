import { TestBed } from "@angular/core/testing";
import { Action, NgxsModule, NGXS_PLUGINS, State, StateContext, Store } from "@ngxs/store";
import { Subject } from "rxjs";
import { ChildHandler, ChildPlugin } from "./child-handler";
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


describe('ChildFeatures', () => {
  let messages: Subject<Message>;
  let commsService: MessageCommunicationService;
  let childHandler: ChildHandler;

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
        ChildHandler,
        ChildPlugin,
        {
          provide: NGXS_PLUGINS,
          useClass: ChildPlugin,
          multi: true,
        },
        {
          provide: MessageCommunicationService,
          useValue: commsService,
        }
      ]
    });

    childHandler = TestBed.inject(ChildHandler);
  });

  describe('ChildHandler', () => {
    it('should request the full store after init', () => {
      spyOn(commsService, 'postMessage');
      childHandler.init();
      expect(commsService.postMessage).toHaveBeenCalledWith({ type: GET_STORE });
    });

    it('should ignore subsequent calls to init', () => {
      const store = TestBed.inject(Store);
      spyOn(store, 'dispatch');
      childHandler.init();
      childHandler.init();
      messages.next({
        type: STORE_UPDATE,
        payload: {},
      });
      expect(store.dispatch).toHaveBeenCalledTimes(1);
    });

    it('should dispatch message events to the store', () => {
      childHandler.init();
      const store = TestBed.inject(Store);
      const payload = {
        test: {
          foo: 'bar',
        }
      };
      spyOn(store, 'dispatch');
      messages.next({
        type: STORE_UPDATE,
        payload,
      });
      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  describe('ChildPlugin', () => {
    let childPlugin: ChildPlugin;

    beforeEach(() => {
      childPlugin = TestBed.inject(ChildPlugin);
    });

    it('should transfer events to host', () => {
      const action = { type: 'foo' };
      const next = jasmine.createSpy('next');
      spyOn(commsService, 'postMessage');
      childPlugin.handle({}, action, next);
      expect(next).not.toHaveBeenCalled();
      expect(commsService.postMessage).toHaveBeenCalledWith({
        type: ACTION_DISPATCHED,
        action,
        actionType: undefined
      });
    });
  });

  it('should update the store', () => {
    childHandler.init();
    const store = TestBed.inject(Store);
    expect(store.snapshot().test.foo).toBe('');
    const payload = {
      test: {
        foo: 'bar',
      }
    };
    messages.next({
      type: STORE_UPDATE,
      payload,
    });
    expect(store.snapshot()).toEqual(payload);
  });
});

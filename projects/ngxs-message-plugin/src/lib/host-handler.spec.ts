import { TestBed } from '@angular/core/testing';
import { Action, NgxsModule, State, StateContext, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { HostHandler } from './host-handler';
import {
  ACTION_DISPATCHED,
  DEBOUNCE_TIME,
  GET_STORE,
  Message,
  MessageCommunicationService,
  STORE_INIT,
  STORE_UPDATE,
} from './symbols';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

class Async {
  static readonly type = '[Test] Async';
}

class Foo {
  static readonly type = '[Test] Foo';

  constructor(public readonly foo: string) {}
}

type TestStateModel = {
  foo: string;
};

@State<TestStateModel>({
  name: 'test',
  defaults: {
    foo: '',
  },
})
export class TestState {
  @Action(Foo)
  foo(ctx: StateContext<TestStateModel>, action: Foo): void {
    ctx.setState({
      foo: action.foo,
    });
  }

  @Action(Async)
  async(ctx: StateContext<TestStateModel>): Observable<void> {
    ctx.setState({ foo: 'async task' });
    return new Observable();
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
      },
    };

    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([TestState])],
      providers: [
        provideExperimentalZonelessChangeDetection(),
        HostHandler,
        {
          provide: MessageCommunicationService,
          useValue: commsService,
        },
        {
          provide: DEBOUNCE_TIME,
          useValue: 0,
        },
      ],
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
        action: JSON.parse(
          JSON.stringify({
            type: Foo.type,
            ...action,
          })
        ),
      });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: Foo.type,
        ...action,
      });
    });

    it('should return state when queried', () => {
      spyOn(commsService, 'postMessage');
      messages.next({ type: GET_STORE });

      expect(commsService.postMessage).toHaveBeenCalledOnceWith({
        type: STORE_INIT,
        payload: store.snapshot(),
      });
    });

    it('should ignore multiple calls to init', () => {
      hostHandler.init();
      spyOn(commsService, 'postMessage');
      messages.next({ type: GET_STORE });

      expect(commsService.postMessage).toHaveBeenCalledOnceWith({
        type: STORE_INIT,
        payload: store.snapshot(),
      });
    });
  });

  it('should update clients after dispatch', (done) => {
    spyOn(commsService, 'postMessage');
    store.dispatch(new Foo('test')).subscribe((state) => {

      expect(commsService.postMessage).toHaveBeenCalledOnceWith({
        type: STORE_UPDATE,
        payload: [
          {
            key: 'test.foo',
            operation: 'update',
            value: 'test',
          },
        ],
      });
      done();
    });
  });

  it('should update clients before async operations complete', () => {
    spyOn(commsService, 'postMessage');
    store.dispatch(new Async());
    expect(commsService.postMessage).toHaveBeenCalledOnceWith({
      type: STORE_UPDATE,
      payload: [
        { key: 'test.foo', operation: 'update', value: 'async task' },
      ],
    });
  });

  it('should update the store', () => {
    expect(store.snapshot().test.foo).toBe('');
    const payload = 'bar';
    messages.next({
      type: ACTION_DISPATCHED,
      action: JSON.parse(JSON.stringify(new Foo(payload))),
      actionType: Foo.type,
    });
    expect(store.snapshot()).toEqual({
      test: {
        foo: payload,
      },
    });
  });
});

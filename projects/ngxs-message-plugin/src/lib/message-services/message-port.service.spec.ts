import { ChildMessagePortService, HostMessagePortService, MessagePortService } from './message-port.service';


describe('MessagePortService', () => {
  let hostService: HostMessagePortService;
  let childService: ChildMessagePortService;

  beforeEach(() => {
    const messageChannel = new MessageChannel();
    hostService = new MessagePortService();
    hostService.addPort(messageChannel.port1, window);

    childService = new MessagePortService();
    childService.addPort(messageChannel.port2, window);
  });

  it('should be able to communicate with other services', done => {
    const msg = { type: 'GET_STORE' } as const;

    // Need another service to test communications

    childService.messages$.subscribe({
      next(val) {
        expect(val.type).toBe(msg.type);
        done();
      },
      error(err) {
        fail(err);
        done();
      },
    });
    hostService.postMessage(msg);
  });
});

import { TestBed } from '@angular/core/testing';
import { BROADCAST_CHANNEL_NAME } from '../symbols';
import { BroadcastChannelService } from './broadcast-channel.service';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';


describe('BroadcastChannelService', () => {
  let service: BroadcastChannelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
        BroadcastChannelService,
        {
          provide: BROADCAST_CHANNEL_NAME,
          useValue: 'channel name'
        }
      ]
    });
    service = TestBed.inject(BroadcastChannelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should communicate with other services', done => {
    const msg = { type: 'GET_STORE' } as const;

    // Need another service to test communications
    const service2 = new BroadcastChannelService(TestBed.inject(BROADCAST_CHANNEL_NAME));

    service2.messages$.subscribe({
      next(val) {
        expect(val.type).toBe(msg.type);
        done();
      },
      error(err) {
        fail(err);
        done();
      },
    });
    service.postMessage(msg);
  });
});

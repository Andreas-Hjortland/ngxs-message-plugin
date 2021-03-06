import { ACTION_DISPATCHED } from './symbols';
import * as utils from './utils';

type DoubleLinkedList<T> = {
  prev: DoubleLinkedList<T> | null;
  value: T;
  next: DoubleLinkedList<T> | null;
};

describe('utils', () => {
  describe('isMessageType', () => {
    it('should recognize message events', () => {
      expect(
        utils.isMessageType(
          new MessageEvent('message', {
            data: {
              type: ACTION_DISPATCHED,
            },
          })
        )
      ).toBeTrue();

      expect(utils.isMessageType(new MessageEvent('message'))).toBeFalse();
    });
  });

  describe('deepMerge', () => {
    it('should not change equal objects', () => {
      const left = {
        bar: 1,
        baz: 2,
        qux: {
          quux: false,
          quuux: true,
        },
      };
      const right = {
        bar: 1,
        baz: 2,
        qux: {
          quux: false,
          quuux: true,
        },
      };
      const { result, equal } = utils.deepMerge(left, right);
      expect(equal).toBeTrue();
      expect(result).toBe(left);
    });

    it('should throw on cyclic data structures', () => {
      const left: DoubleLinkedList<number> = {
        prev: null,
        value: 1,
        next: null,
      };
      left.next = {
        prev: left,
        value: 2,
        next: null,
      };

      const right: DoubleLinkedList<number> = {
        prev: null,
        value: 1,
        next: null,
      };
      right.next = {
        prev: right,
        value: 2,
        next: null,
      };
      expect(utils.deepMerge.bind(utils, left, right)).toThrow(
        new Error('Object cycle detected')
      );
    });

    it('should only change objects that are different', () => {
      const left = {
        bar: 1,
        baz: [{ foo: 1 }, { foo: 2 }],
        qux: {
          quux: false,
          quuux: true,
        },
      };
      const right = {
        bar: 1,
        baz: [{ foo: 1 }, { foo: 2 }, { foo: 3 }],
        qux: {
          quux: false,
          quuux: true,
        },
      };
      const { result, equal } = utils.deepMerge(left, right);
      expect(equal).toBeFalse();
      expect(result.qux).toBe(left.qux);
      expect(result.baz[0]).toBe(left.baz[0]);
      expect(result.baz[2]).toBe(right.baz[2]);
    });
  });
});

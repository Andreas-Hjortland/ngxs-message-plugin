import { ACTION_DISPATCHED } from './symbols';
import * as utils from './utils';

describe('utils', () => {
    describe('isMessageType', () => {
        it('should recognize message events', () => {
            expect(utils.isMessageType(new MessageEvent('message', {
                data: {
                    type: ACTION_DISPATCHED
                }
            }))).toBeTrue();

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
                }
            };
            const right = {
                bar: 1,
                baz: 2,
                qux: {
                    quux: false,
                    quuux: true,
                }
            };
            const { result, equal } = utils.deepMerge(left, right);
            expect(equal).toBeTrue();
            expect(result).toBe(left);
        });

        it('should only change objects that are different', () => {
            const left = {
                bar: 1,
                baz: [
                    { foo: 1 },
                    { foo: 2 },
                ],
                qux: {
                    quux: false,
                    quuux: true,
                }
            };
            const right = {
                bar: 1,
                baz: [
                    { foo: 1 },
                    { foo: 2 },
                    { foo: 3 },
                ],
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
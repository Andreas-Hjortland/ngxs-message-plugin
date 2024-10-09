import { applyDiff, Diff, getDiff } from "./diff";

type State = {
    test: {
        bar: number[];
        baz: {
            qux: string;
        };
    };
    foo: string;
}

describe('DiffAlgorithm', () => {
    let lastState: State;
    let nextState: State;
    let diff: Diff[];

    beforeEach(() => {
        lastState = {
            test: {
                bar: [1, 2, 3],
                baz: {
                    qux: 'quux',
                },
            },
            foo: 'asdf',
        };
        nextState = {
            test: {
                bar: [1, 4, 3],
                baz: {
                    qux: 'quux',
                },
            },
            foo: 'asdf',
        };

        diff = [...getDiff(lastState, nextState)];
    });

    it('should create equal states', () => {
        const result = applyDiff(lastState, diff);
        expect(result).toEqual(nextState);
    });

    it('should not mutate last state when applying diff', () => {
        applyDiff(lastState, diff);
        expect(lastState.test.bar[1]).toBe(2);
    });

    it('should keep reference to untouched parts of state', () => {
        const result = applyDiff(lastState, diff);
        expect(result.test.baz).toBe(lastState.test.baz);
    });

    it('should keep prototype chain of classes', () => {
        class Foo {
            bar: string;
            constructor(bar: string) {
                this.bar = bar;
            }

            getBar() {
                return this.bar;
            }
        }
        class Bar extends Foo {
            baz: string;
            constructor(bar: string, baz: string) {
                super(bar);
                this.baz = baz;
            }

            override toString() {
                return `${this.getBar()}:${this.baz}`;
            }
        }

        const lastState = {
            test: new Bar('bar', 'baz'),
            foo: 'asdf',
        };
        const diff: Diff[] = [
            { key: 'test.bar', operation: 'update', value: 'qux' },
        ];
        const result = applyDiff(lastState, diff);
        expect(result.test).toBeInstanceOf(Bar);
        expect(result.test.toString()).toEqual('qux:baz');
    });

    it('should keep prototype chain of arrays', () => {
        class Foo extends Array<string> {
            bar: string;
            constructor(bar: string) {
                super();
                this.bar = bar;
            }

            doSomething() {
                return `${this.bar}: ${this.join(',')}`;
            }
        }

        const lastState = new Foo('bar');
        lastState.push('baz', 'qux', 'quux');
        const diff: Diff[] = [
            { key: '1', operation: 'update', value: 'changed' },
            { key: 'bar', operation: 'update', value: 'test' },
        ];
        const result = applyDiff(lastState, diff);
        expect(result).toBeInstanceOf(Foo);
        expect(result.doSomething()).toEqual('test: baz,changed,quux');
        expect(result[1]).toEqual('changed');
        expect(result.bar).toEqual('test');
    });

    it('should throw on invalid diff', () => {
        const diff: Diff[] = [
            { key: 'test.foo.bar', operation: 'update', value: 'value' },
        ];
        expect(() => applyDiff(lastState, diff)).toThrow();
    });

    it('should handle different instance types', () => {
        class Foo {
            text: string;
            constructor(text: string) {
                this.text = text;
            }
        }
        class Bar {
            text: string;
            bar = 'content';
            constructor(text: string) {
                this.text = text;
            }
        }
        const lastState = {
            instance: new Foo('test'),
        };
        const nextState = {
            instance: new Bar('test'),
        };
        const diff = Array.from(getDiff(lastState, nextState));
        const result = applyDiff(lastState, diff);
        expect(result).toEqual(nextState);
    });

    // TODO: Add special handling for builtin objects
    it('should be able to clone internal objects', () => {
        const prev = {
            foo: 'bar',
            date: new Date('2020-01-01'),
            regex: /test/,
            //map: new Map([['test', 'removed']]),
            //set: new Set([1, 2, 3]),
        };
        const next = {
            foo: 'bar',
            date: new Date('2024-01-01'),
            regex: /test/i,
            //map: new Map<string | number, string | number>([[1, 2], ['foo', 'bar']]),
            //set: new Set([2, 3, 4]),
        };
        const diff = Array.from(getDiff(prev, next));
        console.log('diff', Array.from(diff));
        expect(applyDiff(prev, diff)).toEqual(next);
    });
  });

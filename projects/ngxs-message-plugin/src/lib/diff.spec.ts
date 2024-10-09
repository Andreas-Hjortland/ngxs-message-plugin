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

describe('HostFeatures', () => {
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
  });

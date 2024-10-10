/**
 * Diff between two objects
 */
export type Diff = {
    key: string; // key of the object, dots for nesting
    operation: 'add' | 'remove' | 'update';
    value?: any;
};

/**
 * Shallow clone an object, keeping prototype chain of classes
 *
 * @param obj Object to clone
 * @returns Shallow clone of input object
 */
function clone<T>(obj: T): T {
    let newVal: T;
    if (Array.isArray(obj)) {
        newVal = [...obj] as T;
        const proto = Object.getPrototypeOf(obj);
        if (proto !== Array.prototype) {
            Object.setPrototypeOf(newVal, proto);
            for (const key in obj) {
                if (!/^\d+$/.test(key) && Object.hasOwn(obj, key)) {
                    (newVal as any)[key] = obj[key];
                }
            }
        }
    } else {
        newVal = Object.create(Object.getPrototypeOf(obj));
        Object.assign(newVal as {}, obj);
    }
    return newVal;
}

/**
 * Check if two values are objects of different types or if they are different values
 */
function isDifferentValueType(prev: unknown, current: unknown): boolean {
    if (typeof prev === 'object' && typeof(current) === 'object' && prev !== null && current !== null) {
        return Object.getPrototypeOf(prev) !== Object.getPrototypeOf(current);
    }

    return prev !== current;
}

function* _getDiff<T>(prev: T, current: T, visited: WeakSet<any>, existingKey: string): Iterable<Diff> {
    if (typeof prev === 'object' && prev) {
        if (visited.has(prev)) {
            return;
        }
        visited.add(prev);
    }


    if (typeof prev !== 'object' || prev === null || typeof current !== 'object' || current === null) {
        if (prev !== current) {
            yield { key: existingKey, operation: 'update', value: current };
        }
    } else {
        for (let propKey in prev) {
            const key = existingKey + propKey;
            if (prev[propKey] === current[propKey]) {
                continue;
            }

            if (!(propKey in current)) {
                yield { key, operation: 'remove' };
            } else if (isDifferentValueType(prev[propKey], current[propKey])) {
                yield { key, operation: 'update', value: current[propKey] };
            } else if (prev[propKey] instanceof Date) {
                if ((prev[propKey] as Date).getTime() !== (current[propKey] as unknown as Date).getTime()) {
                    yield { key, operation: 'update', value: current[propKey] };
                }
            } else if (prev[propKey] instanceof RegExp) {
                if ((prev[propKey] as RegExp).toString() !== (current[propKey] as unknown as RegExp).toString()) {
                    yield { key, operation: 'update', value: current[propKey] };
                }
            } else {
                // TODO: Map, Set, Iterables?
                yield* _getDiff(prev[propKey], current[propKey], visited, `${existingKey}${propKey}.`);
            }
        }
        for (let propKey in current) {
            const key = existingKey + propKey;
            if (!(propKey in prev)) {
                yield { key, operation: 'add', value: current[propKey] };
            }
        }
    }
}

/**
 * Create a diff between two states
 * @param prev Previous version of the state
 * @param current Next version of the state
 * @returns A list of diffs between the two states
 */
export function getDiff<T>(prev: T, current: T): Iterable<Diff> {
    return _getDiff(prev, current, new WeakSet(), '');
}

/**
 * Apply diffs to a state
 *
 * @param oldState State to update
 * @param diffs List of diffs to apply
 * @returns A new instance of the state with the diffs applied. Any object that is not touched by the diff will be the same reference as in the old state.
 * @throws If a diff key does not exist in the state
 */
export function applyDiff<T>(oldState: T, diffs: Iterable<Diff>): T {
    let nextState = clone(oldState);
    for (let diff of diffs) {
        const parts = diff.key.split('.');
        let val: any = nextState;
        for (let part of parts.slice(0, -1)) {
            if (typeof val[part] !== 'object' || val[part] === null) {
                console.error('Invalid diff key', diff.key, 'does not exist in state', oldState, 'Navigated to', val);
                throw new Error(`Invalid diff key ${diff.key} does not exist in state`);
            }
            val = val[part] = clone(val[part]);
        }
        let lastPart = parts.at(-1)!;
        switch (diff.operation) {
            case 'add':
            case 'update':
                val[lastPart] = diff.value;
                break;
            case 'remove':
                delete val[lastPart];
                break;
        }
    }
    return nextState;
}
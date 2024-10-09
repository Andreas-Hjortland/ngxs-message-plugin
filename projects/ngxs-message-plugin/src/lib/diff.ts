export type Diff = {
    key: string; // key of the object, dots for nesting
    operation: 'add' | 'remove' | 'update';
    value?: any;
};

export function* getDiff<T>(oldState: T, nextState: T, visited: WeakSet<any> = new WeakSet(), existingKey: string = ''): Iterable<Diff> {
    if (typeof oldState === 'object' && oldState) {
        if (visited.has(oldState)) {
            return;
        }
        visited.add(oldState);
    }


    if (typeof oldState !== 'object' || oldState === null || typeof nextState !== 'object' || nextState === null) {
        if (oldState !== nextState) {
            yield { key: existingKey, operation: 'update', value: nextState };
        }
    } else {
        for (let propKey in oldState) {
            const key = existingKey + propKey;
            if (oldState[propKey] === nextState[propKey]) {
                continue;
            }

            if (!(propKey in nextState) || typeof nextState[propKey] === 'undefined' || nextState[propKey] === null) {
                yield { key, operation: 'remove' };
            } else if (typeof oldState[propKey] !== typeof nextState[propKey]) {
                yield { key, operation: 'update', value: nextState[propKey] };
            } else if (typeof oldState[propKey] !== 'object') {
                yield { key, operation: 'update', value: nextState[propKey] };
            } else {
                // TODO: dates?
                // TODO: regexes?
                // TODO: Iterables?
                yield* getDiff(oldState[propKey], nextState[propKey], visited, `${existingKey}${propKey}.`);
            }
        }
        for (let propKey in nextState) {
            const key = existingKey + propKey;
            if (!(propKey in oldState) && typeof nextState[propKey] !== 'undefined' && nextState[propKey] !== null) {
                yield { key, operation: 'add', value: nextState[propKey] };
            }
        }
    }
}

export function applyDiff<T>(oldState: T, diffs: Diff[]): T {
    let nextState = { ...oldState };
    for (let diff of diffs) {
        const parts = diff.key.split('.');
        let val: any = nextState;
        for(let part of parts.slice(0, -1)) {
            if (Array.isArray(val[part])) {
                val = val[part] = [...val[part]];
            } else {
                val = val[part] = { ...val[part] };
            }
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
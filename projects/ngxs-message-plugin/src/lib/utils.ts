import { ACTION_DISPATCHED, GET_STORE, Message, STORE_UPDATE } from './symbols';

type MergeResult<T> = {
    result: T,
    equal: boolean,
};

/**
 * Merge 2 lists - this does not try to resolve shifts, so if you have removed 
 * an item in the middle of the list, the whole list will be recomputed after
 * the index of the removed item
 */
function mergeList<T>(objA: T[], objB: T[]): MergeResult<T[]> {
    let i = 0;
    let result: any = [];
    let equal = true;
    for (; i < objA.length && i < objB.length; i++) {
        const merged = deepMerge(objA[i], objB[i]);
        result.push(merged.result);
        equal &&= merged.equal;
    }
    for (; i < objB.length; i++) {
        equal = false;
        result.push(objB[i]);
    }
    if (equal) {
        return { result: objA, equal };
    } else {
        return { result, equal };
    }
}

/**
 * Merge 2 objects - tries to reuse as much of `objA` as possible. @see `deepMerge<T>()`
 */
function mergeObject<T>(objA: T, objB: T): MergeResult<T> {
    const result = {} as T;
    let equal = true;
    const keysTested = new Set();
    for (const key in objA) {
        if (Object.prototype.hasOwnProperty.call(objA, key)) {
            keysTested.add(key);
            if (Object.prototype.hasOwnProperty.call(objB, key)) {
                let merged = deepMerge(objA[key], objB[key]);
                result[key] = merged.result;
                equal &&= merged.equal;
            } else {
                equal = false;
            }
        }
    }
    for (const key in objB) {
        if (Object.prototype.hasOwnProperty.call(objB, key) && !keysTested.has(key)) {
            equal = false;
            result[key] = objB[key];
        }
    }
    if (equal) {
        return { result: objA, equal };
    }
    return { result, equal };
}

/**
 * Do a deep merge between 2 objects. Reuse as much of `objA` as possible
 * 
 * @param objA The base object. If `objA` and `objB` are equal, this will be returned as is
 * @param objB The updated object. Will merge any changes from this into `objA`
 * @returns `objA` if `objA` and `objB` are equal, otherwise an object which keeps as much of the keys of `objA` as possible recursively
 */
export function deepMerge<T>(objA: T, objB: T): MergeResult<T> {
    if (objA === objB) {
        return { result: objA, equal: true };
    } else if (objA instanceof Array && objB instanceof Array) {
        return mergeList(objA, objB) as unknown as MergeResult<T>;
    } else if (objA && objB && typeof objA === 'object' && typeof objB === 'object') { // object that arent `null`
        return mergeObject(objA, objB);
    } else {
        return { result: objB, equal: false };
    }
}

/**
 * Simple test if a postMessage event data is of the Message type
 */
export function isMessageType(evt: MessageEvent): evt is MessageEvent<Message> {
    if (typeof evt?.data?.type === 'string') {
        switch (evt.data.type) {
            case ACTION_DISPATCHED:
            case GET_STORE:
            case STORE_UPDATE:
                break;
            default:
                console.warn('Unknown message type.', evt.data);
                break;
        }
        return true;
    }
    console.warn('Invalid message event', evt);
    return false;
}

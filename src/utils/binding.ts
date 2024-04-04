import { Binding, Connectable } from '../service.js';
import { Variable } from '../variable.js';
import { kebabify } from './gobject.js';

// TODO: consider adding a guard for disposed Variables

type Dep<T> = Binding<any, any, T>
export function merge<V,
    const Deps extends Dep<unknown>[],
    Args extends { [K in keyof Deps]: Deps[K] extends Dep<infer T> ? T : never }
>(deps: Deps, fn: (...args: Args) => V) {
    const update = () => fn(...deps.map(d => d.transformFn(d.emitter[d.prop])) as Args);
    const watcher = new Variable(update());
    for (const dep of deps)
        dep.emitter.connect(`notify::${kebabify(dep.prop)}`, () => watcher.value = update());

    return watcher.bind();
}

export function derive<V,
    const Deps extends Variable<any>[],
    Args extends { [K in keyof Deps]: Deps[K] extends Variable<infer T> ? T : never }
>(deps: Deps, fn: (...args: Args) => V) {
    const update = () => fn(...deps.map(d => d.value) as Args);
    const watcher = new Variable(update());
    for (const dep of deps)
        dep.connect('changed', () => watcher.value = update());

    return watcher;
}

type B<T> = Binding<Variable<T>, any, T>

// eslint-disable-next-line max-len
export function watch<T>(init: T, objs: Array<Connectable | [obj: Connectable, signal?: string]>, callback: () => T): B<T>
export function watch<T>(init: T, obj: Connectable, signal: string, callback: () => T): B<T>
export function watch<T>(init: T, obj: Connectable, callback: () => T): B<T>
export function watch<T>(
    init: T,
    objs: Connectable | Array<Connectable | [obj: Connectable, signal?: string]>,
    sigOrFn: string | (() => T),
    callback?: () => T,
) {
    const v = new Variable(init);
    const f = typeof sigOrFn === 'function' ? sigOrFn : callback ?? (() => v.value);
    const set = () => v.value = f();

    if (Array.isArray(objs)) {
        // multiple objects
        for (const obj of objs) {
            if (Array.isArray(obj)) {
                // obj signal pair
                const [o, s = 'changed'] = obj;
                o.connect(s, set);
            } else {
                // obj on changed
                obj.connect('changed', set);
            }
        }
    } else {
        // watch single object
        const signal = typeof sigOrFn === 'string' ? sigOrFn : 'changed';
        objs.connect(signal, set);
    }

    return v.bind();
}

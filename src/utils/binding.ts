import { Binding } from '../service.js';
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
        dep.emitter.connect(`notify::${kebabify(dep.prop)}`, () => watcher.setValue(update()));

    return watcher.bind();
}

export function derive<V,
    const Deps extends Variable<any>[],
    Args extends { [K in keyof Deps]: Deps[K] extends Variable<infer T> ? T : never }
>(deps: Deps, fn: (...args: Args) => V) {
    const update = () => fn(...deps.map(d => d.value) as Args);
    const watcher = new Variable(update());
    for (const dep of deps)
        dep.connect('changed', () => watcher.setValue(update()));

    return watcher;
}

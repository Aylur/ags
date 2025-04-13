import AstalIO from "gi://AstalIO"

export type Time = AstalIO.Time
export const Time = AstalIO.Time

export function interval(interval: number, callback?: () => void) {
    return AstalIO.Time.interval(interval, () => void callback?.())
}

export function timeout(timeout: number, callback?: () => void) {
    return AstalIO.Time.timeout(timeout, () => void callback?.())
}

export function idle(callback?: () => void) {
    return AstalIO.Time.idle(() => void callback?.())
}

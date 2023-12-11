## signals
* `dismissed`: `(id: number)` notification removed from popups
* `notified`: `(id: number)` notification added to popups and notifications
* `closed`: `(id: number)` notification removed from popups and notifications

## properties
* `dnd`: `boolean` do no disturb, it will permit the notification to be added to Notifications.popups
* `popups`: `Notification[]`
* `notifications`: `Notification[]`

## methods
* `clear`: `() => void`: removes all notifications
* `getNotification`: `(id: number) => Notification`
* `getPopup`: `(id: number) => Notification`

## Notification

### signals
* `dismissed` notification.popup became false
* `closed`
* `invoked`: `(action: string)`

### properties
* `id`: `number`
* `app-name`: `string`
* `app-entry`: `string | null` .desktop file
* `app-icon`: `string`
* `summary`: `string` title
* `body`: `string`
* `actions`: `Array<{ id: string, label: string }>`
* `urgency`: `"low" | "normal" | "critical"`
* `time`: `number` you can `GLib.DateTime.new_from_unix_local(time)`
* `image`: `string | null` path to the image
* `popup`: `boolean` whether this should show as a popup banner
* `hints`: `Record<string, GLib.Variant>` [notification hints](https://specifications.freedesktop.org/notification-spec/notification-spec-latest.html#hints), these are not cached and this returns an empty object if loaded from cache

### methods
* `dismiss` `() => void` sets popup to false
* `close` `() => void`
* `invoke` `(actionId: string) => void` invoking an action will also close the notification

## [Example Notification Center](https://github.com/Aylur/ags/tree/main/example/notification-center)

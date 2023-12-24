> [!NOTE]  
> package dependancy: `network-manager`

> [!NOTE]  
> This service is somewhat incomplete, feel free to open a PR to improve it

## properties
* `connectivity`: `"unknown" | "none" | "portal" | "limited" | "full"`
* `primary`: `"wifi" | "wired"`
* `wired`: `Wired`
* `wifi`: `Wifi`

## methods
* `toggleWifi`: `() => void`

## Wifi

### properties
* `ssid`: `string`
* `strength`: `number` 0..100
* `internet`: `"connected" | "connecting" | "disconnected"`
* `enabled`: `boolean`
* `access-points`: `AccessPoint`
* `icon-name`: `string`
* `state`: `string`: [NM.DeviceState](https://gjs-docs.gnome.org/nm10~1.0/nm.devicestate) as lowercase string

### methods
* `scan`: `() => void`

## AccessPoint
access points are not a GObjects, just a regular js objects
meaning you can't bind to it or use notify::prop signal

### properties
* `bssid`: `string`
* `address`: `string`
* `lastSeen`: `number`
* `ssid`: `string`
* `active`: `boolean`
* `strength`: `number`
* `iconName`: `string` icon name representing its signal strength

## Wired
* `internet`: `"connected" | "connecting" | "disconnected"`
* `state`: `"enabled" | "disabled" | "unknown"`
* `state`: `string`: [NM.DeviceState](https://gjs-docs.gnome.org/nm10~1.0/nm.devicestate) as lowercase string
* `icon-name`: `string`

## Example Widget
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Network from 'resource:///com/github/Aylur/ags/service/network.js';

const WifiIndicator = () => Widget.Box({
    children: [
        Widget.Icon({
            icon: Network.wifi.bind('icon-name'),
        }),
        Widget.Label({
            label: Network.wifi.bind('ssid'),
        }),
    ],
})

const WiredIndicator = () => Widget.Icon({
    icon: Network.wired.bind('icon-name'),
})

const NetworkIndicator = () => Widget.Stack({
    items: [
        ['wifi', WifiIndicator()],
        ['wired', WiredIndicator()],
    ],
    shown: Network.bind('primary').transform(p => p || 'wifi'),
})
```

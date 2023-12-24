> [!NOTE]  
> package dependancy: `gnome-bluetooth-3.0`

> [!NOTE]  
> for the battery percentage to work, make sure you have `Experimental = true` in `/etc/bluetooth/main.conf`
## signals
* `device-added`: `(address: string)`
* `device-removed`: `(address: string)`

## properties
* `enabled`: `boolean`: writable
* `devices`: `Device[]`
* `connected-devices`: `Device[]`

## methods
* `toggle`: `() => void`
* `getDevice`: `(address: string) => Device`

## Device

### properties
* `address`: `string`
* `battery-level`: `number`
* `battery-percentage`: `number`
* `connected`: `boolean`
* `icon-name`: `string`
* `alias`: `string`
* `name`: `string`
* `trusted`: `boolean`
* `paired`: `boolean`

### methods
* `setConnection`: `(connect: boolean) => void`

## Example Widgets
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Bluetooth from 'resource:///com/github/Aylur/ags/service/bluetooth.js';

const connectedList = Widget.Box({
    setup: self => self.hook(Bluetooth, self => {
        self.children = Bluetooth.connectedDevices
            .map(({ iconName, name }) => Label({
                indicator: Widget.Icon(iconName + '-symbolic'),
                child: Widget.Label(name),
            }));

        self.visible = Bluetooth.connectedDevices.length > 0;
    }, 'notify::connected-devices'),
});

const indicator = Widget.Icon({
    icon: Bluetooth.bind('enabled').transform(on =>
        `bluetooth-${on ? 'active' : 'disabled'}-symbolic`),
});
```

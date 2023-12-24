## signals
* `event`: `(name: string, data: string)`: [hyprland ipc events](https://wiki.hyprland.org/IPC/#events-list)
* `urgent-window`: `(windowaddress: int)`
* `keyboard-layout`: `(keyboardname: string, layoutname: string)`
* `submap`: `(name: string)`
* `monitor-added`: `(name: string)`
* `monitor-removed`: `(name: string)`
* `workspace-added`: `(name: string)`
* `workspace-removed`: `(name: string)`
* `client-added`: `(address: string)`
* `client-removed`: `(address: string)`

## properties
* `active`: `Active` see below
* `monitors`: `Monitor[]` a Monitor is the object you would get with `hyprctl monitors -j`
* `workspaces`: `Workspace[]` a Workspace is the object you would get with `hyprctl workspaces -j`
* `clients`: `Client[]` a Client is the object you would get with `hyprctl clients -j`

## methods
* `getMonitor`: `(id: number) => Monitor`
* `getWorkspace`: `(id: number) => Workspace`
* `getClient`: `(address: string) => Client`
* `sendMessage`: `(msg: string) => Promise<string>`: send a message to the [hyprland socket](https://wiki.hyprland.org/IPC/#tmphyprhissocketsock)

## Active
```ts
interface Active {
    monitor: {
        id: number
        name: string
    },
    workspace: {
        id: number
        name: string
    },
    client: {
        address: string
        title: string
        class: string
    },
}
```
The `active` property is composed by subservices, meaning you connect to any sub prop
```js
const widget = Widget({
    setup: self => self
        .hook(Hyprland, self => {})
        .hook(Hyprland.active, self => {})
        .hook(Hyprland.active.monitor, self => {})
        .hook(Hyprland.active.workspace, self => {})
        .hook(Hyprland.active.client, self => {})

        .bind('prop', Hyprland, 'active', active => {})
        .bind('prop', Hyprland.active, 'monitor', monitor => {})
        .bind('prop', Hyprland.active, 'workspace', ws => {})
        .bind('prop', Hyprland.active, 'client', client => {})
        .bind('prop', Hyprland.active.monitor, 'id', id => {})
        .bind('prop', Hyprland.active.workspace, 'id', id => {})
        .bind('prop', Hyprland.active.client, 'address', address => {}),
})
```

## Example Widget
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

const focusedTitle = Widget.Label({
    label: Hyprland.active.client.bind('title'),
    visible: Hyprland.active.client.bind('address')
        .transform(addr => !!addr),
});

const dispatch = ws => Hyprland.sendMessage(`dispatch workspace ${ws}`);

const Workspaces = () => Widget.EventBox({
    onScrollUp: () => dispatch('+1'),
    onScrollDown: () => dispatch('-1'),
    child: Widget.Box({
        children: Array.from({ length: 10 }, (_, i) => i + 1).map(i => Widget.Button({
            attribute: i,
            label: `${i}`,
            onClicked: () => dispatch(i),
        })),

        // remove this setup hook if you want fixed number of buttons
        setup: self => self.hook(Hyprland, () => box.children.forEach(btn => {
            btn.visible = Hyprland.workspaces.some(ws => ws.id === btn.attribute);
        })),
    }),
});
```

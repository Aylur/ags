## signals
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
// its structure
interface Active {
    monitor: string
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

// the active prop is composed by subservices
// meaning you connect to any sub prop
const widget = Widget({
    connections: [
        [Hyprland, self => {}],
        [Hyprland.active, self => {}],
        [Hyprland.active.workspace, self => {}],
        [Hyprland.active.client, self => {}],
    ],
    binds: [
        ['prop', Hyprland, 'active', active => {}],
        ['prop', Hyprland.active, 'monitor', monitor => {}],
        ['prop', Hyprland.active, 'workspace', ws => {}],
        ['prop', Hyprland.active, 'client', client => {}],
        ['prop', Hyprland.active.client, 'address', address => {}],
        ['prop', Hyprland.active.workspace, 'id', id => {}],
    ]
})
```

## Example Widget
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

const focusedTitle = Widget.Label({
    binds: [
        ['label', Hyprland.active.client, 'title'],
        ['visible', Hyprland.active.client, 'address', addr => !!addr],
    ],
});

const dispatch = ws => Utils.execAsync(`hyprctl dispatch workspace ${ws}`);

const Workspaces = () => Widget.EventBox({
    onScrollUp: () => dispatch('+1'),
    onScrollDown: () => dispatch('-1'),
    child: Widget.Box({
        children: Array.from({ length: 10 }, (_, i) => i + 1).map(i => Widget.Button({
            setup: btn => btn.id = i,
            label: `${i}`,
            onClicked: () => dispatch(i),
        })),

        // remove this connection if you want fixed number of buttons
        connections: [[Hyprland, box => box.children.forEach(btn => {
            btn.visible = Hyprland.workspaces.some(ws => ws.id === btn.id);
        })]],
    }),
});
```

# Dialog Example

Simple dialog example to get a `no`/`yes` answer.

![2024-11-13_00-45-58](https://github.com/user-attachments/assets/73a20155-fa0e-4156-aff8-3a0d055abb9b)

:::code-group

```tsx [dialog.ts]
#!/usr/bin/ags run
import { App, Astal, Gtk, Gdk } from "astal/gtk3"

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
const { IGNORE } = Astal.Exclusivity
const { EXCLUSIVE } = Astal.Keymode
const { CENTER } = Gtk.Align

App.start({
    instanceName: "tmp" + Date.now(),
    gtkTheme: "adw-gtk3-dark",
    css: /* css */`
        window {
            all: unset;
            background-color: alpha(black, 0.3);
        }

        window > box {
            margin: 10px;
            padding: 6px;
            box-shadow: 2px 3px 5px 0 alpha(black, 0.6);
            border-radius: 11px;
            background-color: #181818;
            color: white;
            min-width: 200px;
        }

        box > label {
            font-size: large;
            margin: 6px;
        }

        label.title {
            font-size: 1.4em;
        }

        .action {
            color: alpha(white, 0.8);
        }

        button {
            margin: 6px;
        }
    `,
    main: (action = "XYZ") => {
        function yes() {
            print("yes")
            App.quit()
        }

        function no() {
            print("no")
            App.quit()
        }

        function onKeyPress(_: Astal.Window, event: Gdk.Event) {
            if (event.get_keyval()[1] === Gdk.KEY_Escape) {
                no()
            }
        }

        <window
            onKeyPressEvent={onKeyPress}
            exclusivity={IGNORE}
            keymode={EXCLUSIVE}
            anchor={TOP | BOTTOM | LEFT | RIGHT}>
            <box halign={CENTER} valign={CENTER} vertical>
                <label className="title" label="Are you sure you want to do" />
                <label className="action" label={`${action}?`} />
                <box homogeneous>
                    <button onClicked={yes}>
                        Yes
                    </button>
                    <button onClicked={no}>
                        No
                    </button>
                </box>
            </box>
        </window>
    }
})
```

:::

Then it can be used in any script.

```sh
if [[ "$(./dialog.ts -a Shutdown)" == "yes" ]]; then
    shutdown now
fi
```

> [!TIP]
> If you are happy with the script and don't plan to change it anymore [bundle](./bundling.md) it,
> which will remove the dependency on AGS.

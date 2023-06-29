import Bluetooth from '../service/bluetooth.js';
import { Button, Dynamic } from './basic.js';

export function Indicator({
    enabled = { type: 'icon', icon: 'bluetooth-active-symbolic', className: 'enabled' },
    disabled = { type: 'icon', icon: 'bluetooth-disabled-symbolic', className: 'disabled' },
    ...rest
}) {
    const dynamic = Dynamic({
        ...rest,
        items: [
            { value: true, widget: enabled },
            { value: false, widget: disabled },
        ],
    });

    Bluetooth.connect(dynamic, () => {
        dynamic.update(value => value === Bluetooth.enabled);
    });

    return dynamic;
}

export function Toggle(props) {
    const button = Button({
        ...props,
        onClick: Bluetooth.toggle,
    });
    Bluetooth.connect(button, () =>
        button.toggleClassName(Bluetooth.enabled, 'on'));

    return button;
}

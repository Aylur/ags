import Bluetooth from '../service/bluetooth.js';
import { Button, Dynamic } from './basic.js';

export function Indicator({
    absent = { type: 'icon', icon: 'bluetooth-disconnected-symbolic', className: 'absent' },
    enabled = { type: 'icon', icon: 'bluetooth-active-symbolic', className: 'enabled' },
    disabled = { type: 'icon', icon: 'bluetooth-disabled-symbolic', className: 'disabled' },
    ...rest
}) {
    const dynamic = Dynamic({
        ...rest,
        items: [
            { value: 'absent', widget: absent },
            { value: 'enabled', widget: enabled },
            { value: 'disabled', widget: disabled },
        ],
    });

    Bluetooth.connect(dynamic, () => {
        dynamic.update(value => value === Bluetooth.state.state);
    });

    return dynamic;
}

export function Toggle(props) {
    const button = Button({
        ...props,
        onClick: Bluetooth.toggle,
    });
    Bluetooth.connect(button, () => {
        Bluetooth.state.state === 'enabled'
            ? button.get_style_context().add_class('on')
            : button.get_style_context().remove_class('on');
    });
    return button;
}

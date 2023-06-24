import Network from '../service/network.js';
import { Button, Dynamic, Label } from './basic.js';

export function SSIDLabel(props) {
    const label = Label(props);
    Network.connect(label, () => {
        label.label = Network.state.wifi.ssid;
    });
    return label;
}

export function WifiStrengthLabel(props) {
    const label = Label(props);
    Network.connect(label, () => {
        label.label = `${Network.state.wifi.strength}`;
    });
    return label;
}

export function WiredIndicator({
    connecting = { type: 'icon', icon: 'network-wired-acquiring-symbolic' },
    disconnected = { type: 'icon', icon: 'network-wired-no-route-symbolic' },
    disabled = { type: 'icon', icon: 'network-wired-disconnected-symbolic' },
    connected = { type: 'icon', icon: 'network-wired-symbolic' },
    unknown = { type: 'icon', icon: 'content-loading-symbolic' },
    ...rest
}) {
    const dynamic = Dynamic({
        ...rest,
        items: [
            { value: 'unknown', widget: unknown },
            { value: 'disconnected', widget: disconnected },
            { value: 'disabled', widget: disabled },
            { value: 'connected', widget: connected },
            { value: 'connecting', widget: connecting },
        ],
    });

    const decide = () => {
        const { state: { wired: { internet, state } } } = Network;
        if (internet === 'connected' || internet === 'connecting')
            return internet;

        if (state === 'unknown' || state === 'enabled')
            return 'disconnected';

        if (state === 'disabled')
            return 'disabled';

        return 'unknown';
    };

    Network.connect(dynamic, () => {
        dynamic.update(value => value === decide());
    });

    return dynamic;
}

export function WifiIndicator({
    disabled = { type: 'icon', icon: 'network-wireless-disabled-symbolic' },
    disconnected = { type: 'icon', icon: 'network-wireless-offline-symbolic' },
    connecting = { type: 'icon', icon: 'network-wireless-acquiring-symbolic' },
    connected,
    ...rest
}) {
    connected ||= [
        { value: 80, widget: { type: 'icon', icon: 'network-wireless-signal-excellent-symbolic' } },
        { value: 60, widget: { type: 'icon', icon: 'network-wireless-signal-good-symbolic' } },
        { value: 40, widget: { type: 'icon', icon: 'network-wireless-signal-ok-symbolic' } },
        { value: 20, widget: { type: 'icon', icon: 'network-wireless-signal-weak-symbolic' } },
        { value: 0,  widget: { type: 'icon', icon: 'network-wireless-signal-none-symbolic' } },
    ];

    const dynamic = Dynamic({
        ...rest,
        items: [
            { value: 'disabled', widget: disabled },
            { value: 'disconnected', widget: disconnected },
            { value: 'connecting', widget: connecting },
            ...connected,
        ],
    });

    const decide = () => {
        const { state: { wifi: { internet, enabled, strength } } } = Network;
        if (internet === 'connected')
            return strength;

        if (internet === 'connecting')
            return 'connecting';

        if (enabled)
            return 'disconnected';

        return 'disabled';
    };

    Network.connect(dynamic, () => {
        dynamic.update(value => {
            const v = decide();
            if (typeof v === 'string')
                return value === v;

            return value <= v;
        });
    });

    return dynamic;
}

export function Indicator({
    wifi = { type: 'network/wifi-indicator' },
    wired = { type: 'network/wired-indicator' },
    ...rest
}) {
    const dynamic = Dynamic({
        ...rest,
        items: [
            { value: 'wired', widget: wired },
            { value: 'wifi', widget: wifi },
        ],
    });

    Network.connect(dynamic, () => {
        const primary = Network.state.primary || 'wifi';
        dynamic.update(value => value === primary);
    });

    return dynamic;
}

export function WifiToggle(props) {
    const button = Button({
        ...props,
        onClick: Network.toggleWifi,
    });
    Network.connect(button, () => {
        Network.state.wifi.enabled
            ? button.get_style_context().add_class('on')
            : button.get_style_context().remove_class('on');
    });
    return button;
}

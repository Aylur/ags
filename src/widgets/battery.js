import Battery from '../service/battery.js';
import { Dynamic, Label } from './basic.js';

function _default(charging) {
    const items = [];
    for (let i=0; i<=90; i+=10) {
        items.push({
            value: i,
            widget: {
                type: 'icon',
                className: `${i} ${charging ? 'charging' : 'discharging'}`,
                icon: `battery-level-${i}${charging ? '-charging' : ''}-symbolic`,
            },
        });
    }
    items.push({
        value: 100,
        widget: {
            type: 'icon',
            className: `100 ${charging ? 'charging' : 'discharging'}`,
            icon: `battery-level-100${charging ? '-charged' : ''}-symbolic`,
        },
    });

    return items.reverse();
}

function _indicators(items) {
    const dynamic = Dynamic({ items });
    Battery.connect(dynamic, () => {
        dynamic.update(value => {
            const { state } = Battery;
            return state.percent >= value;
        });
    });

    return dynamic;
}

export function Indicator({
    charging = _indicators(_default(true)),
    discharging = _indicators(_default(false)),
    ...rest
}) {
    const dynamic = Dynamic({
        ...rest,
        items: [
            { value: true, widget: charging },
            { value: false, widget: discharging },
        ],
    });

    Battery.connect(dynamic, () => {
        const { state: { charging, charged } } = Battery;
        dynamic.update(value => value === charging || value === charged);
    });

    return dynamic;
}

export function LevelLabel(props) {
    const label = Label(props);
    Battery.connect(label, () => {
        label.label = `${Battery.state.percent}`;
    });
    return label;
}

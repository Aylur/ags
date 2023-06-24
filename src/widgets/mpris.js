import Mpris from '../service/mpris.js';
import { lookUpIcon, typecheck } from '../utils.js';
import * as Utils from '../utils.js';
import * as Basic from './basic.js';

export function Box({ player, ...props }) {
    const box = Basic.Box(props);
    Mpris.connect(box, () => {
        box.visible = Mpris.getPlayer(player);
    });
    const id = box.connect('draw', () => {
        box.visible = Mpris.getPlayer(player);
        box.disconnect(id);
    });

    return box;
}

export function CoverArt({ player, ...props }) {
    const box = Basic.Box(props);
    Mpris.connect(box, () => {
        const url = Mpris.getPlayer(player)?.state?.coverPath;
        if (!url)
            return;

        box.set_css(`background-image: url("${url}")`);
    });

    return box;
}

export function TitleLabel({ player, ...props }) {
    const label = Basic.Label(props);
    Mpris.connect(label, () => {
        label.label = Mpris.getPlayer(player)?.state?.trackTitle || '';
    });

    return label;
}

export function ArtistLabel({ player, ...props }) {
    const label = Basic.Label(props);
    Mpris.connect(label, () => {
        label.label = Mpris.getPlayer(player)?.state?.trackArtists.join(', ') || '';
    });

    return label;
}

export function PlayerLabel({ player, ...props }) {
    const label = Basic.Label(props);
    Mpris.connect(label, () => {
        const name = Mpris.getPlayer(player)?.name;

        if (name)
            label.label = name[0].toUpperCase() + name.slice(1);
    });
    return label;
}

export function PlayerIcon({ type, player, symbolic, ...props }) {
    symbolic ||= false;
    typecheck('symbolic', symbolic, 'boolean', type);

    const icon = Basic.Icon({ type, ...props });
    Mpris.connect(icon, () => {
        const name = `${Mpris.getPlayer(player)?.entry}${symbolic ? '-symbolic' : ''}`;
        lookUpIcon(name)
            ? icon.icon_name = name
            : icon.icon_name = 'audio-x-generic-symbolic';
    });

    return icon;
}

export function VolumeSlider({ type, player, ...props }) {
    const slider = Basic.Slider({
        type, ...props,
        onChange: value => {
            const mpris = Mpris.getPlayer(player);
            if (mpris.state.volume >= 0)
                Mpris.getPlayer(player).setVolume(value);
        },
    });

    const update = () => {
        if (slider._dragging)
            return;

        const mpris = Mpris.getPlayer(player);
        slider.visible = mpris;
        if (mpris) {
            slider.visible = mpris.state.volume >= 0;
            slider.adjustment.value = mpris.state.volume;
        }
    };
    Mpris.connect(slider, update);

    return slider;
}

export function VolumeIcon({ type, player, items }) {
    items ||= [
        { value: 67, widget: { type: 'icon', icon: 'audio-volume-high-symbolic' } },
        { value: 34, widget: { type: 'icon', icon: 'audio-volume-medium-symbolic' } },
        { value: 1, widget: { type: 'icon', icon: 'audio-volume-low-symbolic' } },
        { value: 0, widget: { type: 'icon', icon: 'audio-volume-muted-symbolic' } },
    ];

    const icon = Basic.Dynamic({ type, items });
    Mpris.connect(icon, () => {
        const mpris = Mpris.getPlayer(player);
        icon.visible = mpris?.state.volume >= 0;
        const value = mpris?.state.volume || 0;
        icon.update(threshold => threshold <= value);
    });

    return icon;
}

export function PositionSlider({ type, player, interval, ...props }) {
    interval ||= 1000;
    typecheck('interval', interval, 'number', type);

    const slider = Basic.Slider({
        type, ...props,
        onChange: value => {
            const mpris = Mpris.getPlayer(player);
            if (mpris.state.length >= 0)
                Mpris.getPlayer(player).setPosition(mpris.state.length*value/100);
        },
    });

    const update = () => {
        if (slider._dragging)
            return;

        const mpris = Mpris.getPlayer(player);
        slider.visible = mpris?.state.length > 0;
        if (mpris && mpris.state.length > 0) {
            const pos = mpris.getPosition();
            const max = mpris.state.length;
            slider.adjustment.value = pos/max*100;
        }
    };
    Utils.interval(slider, interval, update);
    Mpris.connect(slider, update);

    return slider;
}

function _lengthStr(length) {
    const min = Math.floor(length / 60);
    const sec0 = Math.floor(length % 60) < 10 ? '0' : '';
    const sec = Math.floor(length % 60);
    return `${min}:${sec0}${sec}`;
}

export function PositionLabel({ type, player, interval, ...props }) {
    interval ||= 1000;
    typecheck('interval', interval, 'number', type);

    const label = Basic.Label({ type, ...props });
    let binding = null;
    const connect = mpris => {
        if (mpris && !binding) {
            binding = mpris.connect('position', (_, time) => {
                label.label = _lengthStr(time);
            });
            label.connect('destroy', () => {
                if (mpris)
                    mpris.disconnect(binding);

                binding = null;
            });
        }
    };
    const update = () => {
        const mpris = Mpris.getPlayer(player);
        connect(mpris);
        mpris && mpris.state.length > 0
            ? label.label = _lengthStr(mpris.getPosition())
            : label.visible = mpris;

        return true;
    };
    Utils.interval(label, interval, update);
    Mpris.connect(label, update);

    return label;
}

export function LengthLabel({ player, ...props }) {
    const label = Basic.Label(props);
    Mpris.connect(label, () => {
        const mpris = Mpris.getPlayer(player);
        mpris && mpris.state.length > 0
            ? label.label = _lengthStr(mpris.state.length)
            : label.visible = mpris;
    });
    return label;
}

const _playerButton = ({ player, items, onClick, prop, canProp, cantValue }) => {
    if (cantValue !== null)
        cantValue = false;

    const dynamic = Basic.Dynamic({ items });

    const button = Basic.Button({
        child: dynamic,
        onClick: () => {
            Mpris.getPlayer(player)?.[onClick]();
        },
    });
    Mpris.connect(button, () => {
        const mpris = Mpris.getPlayer(player);
        if (!mpris || mpris.state[canProp] === cantValue)
            return button.hide();

        button.show();
        dynamic.update(value => value === mpris.state[prop]);
    });

    return button;
};

export function ShuffleButton({ type, player, enabled, disabled, ...rest }) {
    enabled ||= 'shuffle enabled';
    disabled ||= 'shuffle disabled';
    Utils.restcheck(rest, type);
    return _playerButton({
        player,
        items: [
            { value: true, widget: enabled },
            { value: false, widget: disabled },
        ],
        onClick: 'shuffle',
        prop: 'shuffle',
        canProp: 'shuffle',
        cantValue: null,
    });
}

export function LoopButton({ type, player, none, track, playlist, ...rest }) {
    none ||= 'loop none';
    track ||= 'loop track';
    playlist ||= 'loop playlist';
    Utils.restcheck(rest, type);
    return _playerButton({
        player,
        items: [
            { value: 'None', widget: none },
            { value: 'Track', widget: track },
            { value: 'Playlist', widget: playlist },
        ],
        onClick: 'loop',
        prop: 'loopStatus',
        canProp: 'loopStatus',
        cantValue: null,
    });
}

export function PlayPauseButton({ type, player, playing, paused, stopped, ...rest }) {
    playing ||= 'playing';
    paused ||= 'paused';
    stopped ||= 'stopped';
    Utils.restcheck(rest, type);
    return _playerButton({
        player,
        items: [
            { value: 'Playing', widget: playing },
            { value: 'Paused', widget: paused },
            { value: 'Stopped', widget: stopped },
        ],
        onClick: 'playPause',
        prop: 'playBackStatus',
        canProp: 'canPlay',
    });
}

export function PreviusButton({ type, player, child, ...rest }) {
    child ||= 'previous';
    Utils.restcheck(rest, type);
    return _playerButton({
        player,
        items: [
            { value: true, widget: child },
        ],
        onClick: 'previous',
        prop: 'canGoPrev',
        canProp: 'canGoPrev',
    });
}

export function NextButton({ type, player, child, ...rest }) {
    child ||= 'next';
    Utils.restcheck(rest, type);
    return _playerButton({
        player,
        items: [
            { value: true, widget: child },
        ],
        onClick: 'next',
        prop: 'canGoNext',
        canProp: 'canGoNext',
    });
}

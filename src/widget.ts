import Gtk from 'gi://Gtk?version=3.0';
import { typecheck, error, warning } from './utils.js';
import * as Basic from './widgets/basic.js';
import { AppLauncher } from './widgets/apps.js';
import { Clock } from './widgets/clock.js';
import * as Hyprland from './widgets/hyprland.js';
import * as Mpris from './widgets/mpris.js';
import * as Network from './widgets/network.js';
import * as Battery from './widgets/battery.js';
import * as Audio from './widgets/audio.js';
import * as Bluetooth from './widgets/bluetooth.js';
import * as Notifications from './widgets/notifications.js';

interface ServiceAPI {
  _instance: any
  connect(widget: Gtk.Widget, callback: () => void): void
  disconnect(id: number): void
}

interface Widget {
  type: string
  className?: string
  style?: string
  halign?: 'start'|'center'|'end'|'fill'
  valign?: 'start'|'center'|'end'|'fill'
  hexpand?: boolean
  vexpand?: boolean
  sensitive?: boolean
  tooltip?: string
  visible?: boolean
  connections?: ([s: string|ServiceAPI, callback: (...args: any[]) => any] | [ServiceAPI, number])[]
  [key: string]: any
}

interface Widgets {
    [key: string]: (props: any) => Gtk.Widget
}

const widgets: Widgets = {
    'box': Basic.Box,
    'button': Basic.Button,
    'centerbox': Basic.CenterBox,
    'dynamic': Basic.Dynamic,
    'entry': Basic.Entry,
    'eventbox': Basic.EventBox,
    'icon': Basic.Icon,
    'label': Basic.Label,
    'revealer': Basic.Revealer,
    'scrollable': Basic.Scrollable,
    'slider': Basic.Slider,

    'app-launcher': AppLauncher,
    'clock': Clock,

    'hyprland/workspaces': Hyprland.Workpsaces,
    'hyprland/window-label': Hyprland.WindowLabel,
    'hyprland/window-icon': Hyprland.WindowIcon,
    'hyprland/taskbar': Hyprland.Taskbar,

    'mpris/box': Mpris.Box,
    'mpris/cover-art': Mpris.CoverArt,
    'mpris/title-label': Mpris.TitleLabel,
    'mpris/artist-label': Mpris.ArtistLabel,
    'mpris/player-icon': Mpris.PlayerIcon,
    'mpris/player-label': Mpris.PlayerLabel,
    'mpris/volume-slider': Mpris.VolumeSlider,
    'mpris/volume-icon': Mpris.VolumeIcon,
    'mpris/position-slider': Mpris.PositionSlider,
    'mpris/position-label': Mpris.PositionLabel,
    'mpris/length-label': Mpris.LengthLabel,
    'mpris/shuffle-button': Mpris.ShuffleButton,
    'mpris/loop-button': Mpris.LoopButton,
    'mpris/previous-button': Mpris.PreviusButton,
    'mpris/play-pause-button': Mpris.PlayPauseButton,
    'mpris/next-button': Mpris.NextButton,

    'network/ssid-label': Network.SSIDLabel,
    'network/wifi-strength-label': Network.WifiStrengthLabel,
    'network/wired-indicator': Network.WiredIndicator,
    'network/wifi-indicator': Network.WifiIndicator,
    'network/indicator': Network.Indicator,
    'network/wifi-toggle': Network.WifiToggle,

    'battery/indicator': Battery.Indicator,
    'battery/level-label': Battery.LevelLabel,

    'audio/speaker-indicator': Audio.SpeakerIndicator,
    'audio/speaker-label': Audio.SpeakerLabel,
    'audio/speaker-slider': Audio.SpeakerSlider,
    'audio/microphone-mute-indicator': Audio.MicMuteIndicator,
    'audio/microphone-mute-toggle': Audio.MicMuteToggle,

    'bluetooth/indicator': Bluetooth.Indicator,
    'bluetooth/toggle': Bluetooth.Toggle,

    'notifications/notification-list': Notifications.NotificationList,
    'notifications/popup-list': Notifications.NotificationPopups,
    'notifications/placeholder': Notifications.Placeholder,
    'notifications/clear-button': Notifications.ClearButton,
    'notifications/dnd-toggle': Notifications.DNDToggle,
    'notifications/dnd-indicator': Notifications.DNDIndicator,
};

function parseParams(widget: Gtk.Widget, {
    type, className, style, sensitive, tooltip,  connections,
    halign = 'fill', valign = 'fill',
    hexpand = false, vexpand = false, visible = true,
}: Widget) {
    typecheck('className', className, ['string', 'undefined'], type);
    typecheck('style', style, ['string', 'undefined'], type);
    typecheck('sensitive', sensitive, ['boolean', 'undefined'], type);
    typecheck('tooltip', tooltip, ['string', 'undefined'], type);
    typecheck('halign', halign, 'string', type);
    typecheck('valign', valign, 'string', type);
    typecheck('hexpand', hexpand, 'boolean', type);
    typecheck('vexpand', vexpand, 'boolean', type);
    typecheck('visible', visible, 'boolean', type);

    if (className) {
        className.split(' ').forEach(cn => {
            widget.get_style_context().add_class(cn);
        });
    }

    try {
        // @ts-ignore
        widget.halign = Gtk.Align[halign.toUpperCase()];
        // @ts-ignore
        widget.valign = Gtk.Align[valign.toUpperCase()];
    } catch (err) {
        warning('wrong align value');
    }

    widget.hexpand = hexpand;
    widget.vexpand = vexpand;

    if (sensitive !== undefined)
        widget.sensitive = sensitive;

    if (tooltip)
        widget.set_tooltip_text(tooltip);

    // @ts-ignore
    widget.setStyle = (css: string) => {
        const provider = new Gtk.CssProvider();
        provider.load_from_data(`* { ${css} }`);
        widget.reset_style();
        widget.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
    };

    // @ts-ignore
    widget.toggleClassName = (condition: boolean, className: string) => {
        condition
            ? widget.get_style_context().add_class(className)
            : widget.get_style_context().remove_class(className);
    };

    if (style)
        // @ts-ignore
        widget.setStyle(style);

    if (!visible)
        widget.hide();

    if (connections) {
        connections.forEach(([s, callback]) => {
            if (typeof callback === 'number') {
                widget.connect('destroy', () => (s as ServiceAPI).disconnect(callback));
                return;
            }

            if (typeof s === 'string')
                widget.connect(s, callback);

            else if (typeof s?.connect === 'function')
                s.connect(widget, callback);
        });
    }
}

export default function Widget(params: null|Widget|string|(() => Gtk.Widget)|Gtk.Widget ): Gtk.Widget {
    if (!params) {
        error('Widget from null');
        return new Gtk.Label({ label: `Null error on ${params}` });
    }

    if (typeof params === 'string')
        return new Gtk.Label({ label: params });

    if (typeof params === 'function')
        return params();

    if (params instanceof Gtk.Widget)
        return params;

    const {
        type, className, style, halign, valign, connections,
        hexpand, vexpand, sensitive, tooltip, visible,
        ...props
    }: Widget = params;

    let widget: Gtk.Widget|null = null;
    if (typeof type === 'function')
        widget = (type as () => Gtk.Widget)();

    if (typeof type === 'string' && type in widgets)
        widget = widgets[type]({ type, ...props });

    if (widget === null) {
        error(`There is no widget with type ${type}`);
        return new Gtk.Label({ label: `${type} doesn't exist` });
    }

    parseParams(widget, {
        type, className, style, halign, valign, connections,
        hexpand, vexpand, sensitive, tooltip, visible,
    });

    return widget;
}

Widget.widgets = widgets;

import App from '../app.js';
import GLib from 'gi://GLib?version=2.0';
import { type Urgency, type Hints } from '../service/notifications.js';

type ClosedReason = ReturnType<typeof _CLOSED_REASON>

// libnotify is not async, so it halts the js engine
// when the notification daemon is in the same process
// so when the daemon acquires the dbus name
// it will switch this to true, so we know to
// use the builtin daemon instead of libnotify
export const daemon = {
    running: false,
};

const _URGENCY = (urgency: Urgency) => {
    switch (urgency) {
        case 'low': return 0;
        case 'critical': return 2;
        default: return 1;
    }
};

const _CLOSED_REASON = (reason: number) => {
    switch (reason) {
        case -1: return 'unset';
        case 1: return 'timeout';
        case 2: return 'dismissed';
        case 3: return 'closed';
        default: return 'undefined';
    }
};

/*
 * this module gets loaded on startup, so in order
 * to make libnotify an optional dependency we do this
 */
async function libnotify() {
    try {
        const Notify = (await import('gi://Notify')).default;

        if (Notify.is_initted())
            return Notify;

        Notify.init(null);
        return Notify;
    } catch (error) {
        console.error(Error('Missing dependency: libnotify'));
        return null;
    }
}

export interface NotificationArgs {
    appName?: string
    body?: string
    iconName?: string
    id?: number
    summary?: string
    urgency?: Urgency
    category?: string
    actions?: {
        [label: string]: () => void,
    }
    timeout?: number
    onClosed?: (reason: ClosedReason) => void

    // hints
    actionIcons?: boolean;
    desktopEntry?: string;
    image?: string;
    resident?: boolean;
    soundFile?: string;
    soundName?: string;
    suppressSound?: boolean;
    transient?: boolean;
    x?: number;
    y?: number;
}

export async function notify(args: NotificationArgs): Promise<number>
export async function notify(
    summary: string, body?: string, iconName?: string): Promise<number>

export async function notify(
    argsOrSummary: NotificationArgs | string,
    body = '',
    iconName = '',
): Promise<number> {
    const args = typeof argsOrSummary === 'object'
        ? argsOrSummary
        : {
            summary: argsOrSummary,
            body,
            iconName,
        };

    if (daemon.running) {
        const { default: Daemon } = await import('../service/notifications.js');

        const actions = Object.entries(args.actions || {}).map(([label, callback], i) => ({
            id: `${i}`, label, callback,
        }));

        const hints: Hints = {
            'action-icons': new GLib.Variant('b', args.actionIcons ?? false),
            'category': new GLib.Variant('s', args.category ?? ''),
            'desktop-entry': new GLib.Variant('s', args.desktopEntry ?? ''),
            'image-path': new GLib.Variant('s', args.image ?? ''),
            'resident': new GLib.Variant('b', args.resident ?? false),
            'sound-file': new GLib.Variant('s', args.soundFile ?? ''),
            'sound-name': new GLib.Variant('s', args.soundName ?? ''),
            'suppress-sound': new GLib.Variant('b', args.suppressSound ?? false),
            'transient': new GLib.Variant('b', args.transient ?? false),
            'urgency': new GLib.Variant('i', args.urgency ?? 1),
        };

        if (args.x !== undefined)
            hints['x'] = new GLib.Variant('i', args.x);

        if (args.y !== undefined)
            hints['y'] = new GLib.Variant('i', args.y);

        const id = Daemon.Notify(
            args.appName || App.applicationId!,
            args.id || 0,
            args.iconName || '',
            args.summary || '',
            args.body || '',
            actions.flatMap(({ id, label }) => [id, label]),
            hints,
            args.timeout || 0,
        );

        Daemon.getNotification(id)?.connect('invoked', (_, actionId: string) => {
            const action = actions.find(({ id }) => id === actionId);
            if (action)
                action.callback();
        });

        return id;
    }

    const Notify = await libnotify();
    if (!Notify) {
        console.error(Error('missing dependency: libnotify'));
        return -1;
    }

    const n = new Notify.Notification({
        summary: args.summary ?? '',
        body: args.body ?? '',
        id: args.id ?? 0,
        iconName: args.iconName ?? '',
        appName: args.appName ?? Notify.get_app_name(),
    });

    n.set_urgency(_URGENCY(args.urgency ?? 'normal'));
    n.set_timeout(args.timeout ?? 0);

    const hint = (key: string, type: 'b' | 's' | 'i', value?: boolean | string | number) => {
        if (value)
            n.set_hint(key, new GLib.Variant(type, value));
    };

    hint('action-icons', 'b', args.actionIcons);
    hint('desktop-entry', 's', args.desktopEntry);
    hint('image-path', 's', args.image);
    hint('resident', 'b', args.resident);
    hint('sound-file', 's', args.soundFile);
    hint('sound-name', 's', args.soundName);
    hint('suppress-sound', 'b', args.suppressSound);
    hint('transient', 'b', args.transient);
    hint('x', 'i', args.x);
    hint('y', 'i', args.y);

    Object.keys(args.actions || {}).forEach((action, i) => {
        n.add_action(`${i}`, action, args.actions![action]);
    });

    n.connect('closed', () => {
        if (args.onClosed)
            args.onClosed(_CLOSED_REASON(n.get_closed_reason()));
    });

    n.show();
    return n.id;
}

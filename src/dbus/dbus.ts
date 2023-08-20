import Gio from 'gi://Gio';

const dbus = `
<node>
    <interface name="org.freedesktop.DBus">
        <method name="ListNames">
            <arg type="as" direction="out" name="names"/>
        </method>
        <signal name="NameOwnerChanged">
            <arg type="s" direction="out" name="name"/>
            <arg type="s" direction="out" name="oldOwner"/>
            <arg type="s" direction="out" name="newOwner"/>
        </signal>
    </interface>
</node>`;

export interface TDBusProxy {
    new(...args: any[]): TDBusProxy
    connect: (event: string, callback: () => void) => number
    disconnect: (id: number) => void
    g_name_owner: string
    ListNamesRemote: (callback: (names: string[][]) => void) => void
    connectSignal: (
        event: string,
        callback: (
            proxy: string,
            sender: string,
            owners: string[]
        ) => void) => void
}

export const DBusProxy = Gio.DBusProxy.makeProxyWrapper(dbus) as TDBusProxy;

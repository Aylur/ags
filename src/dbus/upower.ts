import Gio from 'gi://Gio';

const upower = `
<node>
    <interface name="org.freedesktop.UPower.Device">
        <property name="State" type="u" access="read"/>
        <property name="Percentage" type="d" access="read"/>
        <property name="IsPresent" type="b" access="read"/>
    </interface>
</node>`;

export type BatteryProxy = {
    State: number,
    Percentage: number,
    IsPresent: boolean,
    connect: (event: string, callback: () => void) => void
}

export const PowerManagerProxy = Gio.DBusProxy.makeProxyWrapper(upower);

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Dbusmenu from 'gi://Dbusmenu';
import { AgsMenu } from '../widgets/menu.js';

export const StatusNotifierWatcherIFace = `
<node>
  <interface name="org.kde.StatusNotifierWatcher">
    <annotation name="org.gtk.GDBus.C.Name" value="Watcher" />
    <method name="RegisterStatusNotifierItem">
      <annotation name="org.gtk.GDBus.C.Name" value="RegisterItem" />
      <arg name="service" type="s" direction="in"/>
    </method>
    <method name="RegisterStatusNotifierHost">
        <annotation name="org.gtk.GDBus.C.Name" value="RegisterHost" />
        <arg name="service" type="s" direction="in"/>
    </method>
    <property name="RegisteredStatusNotifierItems" type="as" access="read">
      <annotation name="org.gtk.GDBus.C.Name" value="RegisteredItems" />
      <annotation name="org.qtproject.QtDBus.QtTypeName.Out0"
                  value="QStringList"/>
    </property>
    <property name="IsStatusNotifierHostRegistered" type="b" access="read">
      <annotation name="org.gtk.GDBus.C.Name" value="IsHostRegistered" />
    </property>
    <property name="ProtocolVersion" type="i" access="read"/>
    <signal name="StatusNotifierItemRegistered">
      <annotation name="org.gtk.GDBus.C.Name" value="ItemRegistered" />
      <arg type="s" direction="out" name="service" />
    </signal>
    <signal name="StatusNotifierItemUnregistered">
      <annotation name="org.gtk.GDBus.C.Name" value="ItemUnregistered" />
      <arg type="s" direction="out" name="service" />
    </signal>
    <signal name="StatusNotifierHostRegistered">
      <annotation name="org.gtk.GDBus.C.Name" value="HostRegistered" />
    </signal>
    <signal name="StatusNotifierHostUnregistered">
      <annotation name="org.gtk.GDBus.C.Name" value="HostUnregistered" />
    </signal>
  </interface>
</node>
`;

export const StatusNotifierItemIFace = `
<node>
    <interface name="org.kde.StatusNotifierItem">
        <property name="Category" type="s" access="read"/>
        <property name="Id" type="s" access="read"/>
        <property name="Title" type="s" access="read"/>
        <property name="Status" type="s" access="read"/>
        <property name="WindowId" type="i" access="read"/>
        <property name="IconThemePath" type="s" access="read"/>
        <property name="ItemIsMenu" type="b" access="read"/>
        <property name="Menu" type="o" access="read"/>
        <property name="IconName" type="s" access="read"/>
        <property name="IconPixmap" type="a(iiay)" access="read">
            <annotation name="org.qtproject.QtDBus.QtTypeName"
                        value="KDbusImageVector"/>
        </property>
        <property name="AttentionIconName" type="s" access="read"/>
        <property name="AttentionIconPixmap" type="a(iiay)" access="read">
            <annotation name="org.qtproject.QtDBus.QtTypeName"
                        value="KDbusImageVector"/>
        </property>
        <property name="ToolTip" type="(sa(iiay)ss)" access="read">
            <annotation name="org.qtproject.QtDBus.QtTypeName"
                        value="KDbusToolTipStruct"/>
        </property>
        <method name="ContextMenu">
            <arg name="x" type="i" direction="in"/>
            <arg name="y" type="i" direction="in"/>
        </method>
        <method name="Activate">
            <arg name="x" type="i" direction="in"/>
            <arg name="y" type="i" direction="in"/>
        </method>
        <method name="SecondaryActivate">
            <arg name="x" type="i" direction="in"/>
            <arg name="y" type="i" direction="in"/>
        </method>
        <method name="Scroll">
            <arg name="delta" type="i" direction="in"/>
            <arg name="orientation" type="s" direction="in"/>
        </method>
        <signal name="NewTitle">
        </signal>
        <signal name="NewIcon">
        </signal>
        <signal name="NewToolTip">
        </signal>
        <signal name="NewStatus">
            <arg name="status" type="s"/>
        </signal>
    </interface>
</node>
`;

export interface TStatusNotifierItemProxy extends Gio.DBusProxy {
    new(...args: any[]): TStatusNotifierItemProxy;

    Category: string;
    Id: string;
    Title: string;
    Status: string;
    WindowId: number;
    IconThemePath: string;
    ItemIsMenu: boolean;
    Menu: string;
    DbusMenusClient: Dbusmenu.Client;
    AgsMenu: AgsMenu;
    IconName: string;
    IconPixmap: [number, number, Uint8Array][];
    AttentionIconName: string;
    AttentionIconPixmap: [number, number, Uint8Array][];
    ToolTip: [string, [number, number, Uint8Array], string, string];
    ContextMenuAsync: (x: number, y: number) => Promise<void>;
    ActivateAsync: (x: number, y: number) => Promise<void>;
    SecondaryActivateAsync: (x: number, y: number) => Promise<void>;
    ScrollAsync: (delta: number, orientation: string) => Promise<void>;
}

export const StatusNotifierItemProxy = Gio.DBusProxy
    .makeProxyWrapper(StatusNotifierItemIFace) as TStatusNotifierItemProxy;
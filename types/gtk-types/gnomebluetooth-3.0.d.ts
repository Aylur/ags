
/*
 * Type Definitions for Gjs (https://gjs.guide/)
 *
 * These type definitions are automatically generated, do not edit them by hand.
 * If you found a bug fix it in `ts-for-gir` or create a bug report on https://github.com/gjsify/ts-for-gir
 */

import './gnomebluetooth-3.0-import.d.ts';
/**
 * GnomeBluetooth-3.0
 */

import type Gio from './gio-2.0.js';
import type GObject from './gobject-2.0.js';
import type GLib from './glib-2.0.js';

export namespace GnomeBluetooth {

/**
 * A more precise power state for a Bluetooth adapter.
 */
enum AdapterState {
    /**
     * Bluetooth adapter is missing.
     */
    ABSENT,
    /**
     * Bluetooth adapter is on.
     */
    ON,
    /**
     * Bluetooth adapter is being turned on.
     */
    TURNING_ON,
    /**
     * Bluetooth adapter is being turned off.
     */
    TURNING_OFF,
    /**
     * Bluetooth adapter is off.
     */
    OFF,
}
/**
 * The type of battery reporting supported by the device.
 */
enum BatteryType {
    /**
     * no battery reporting
     */
    NONE,
    /**
     * battery reported in percentage
     */
    PERCENTAGE,
    /**
     * battery reported coarsely
     */
    COARSE,
}
/**
 * The type of a Bluetooth device. See also %BLUETOOTH_TYPE_INPUT and %BLUETOOTH_TYPE_AUDIO
 * @bitfield 
 */
enum Type {
    /**
     * any device, or a device of an unknown type
     */
    ANY,
    /**
     * a telephone (usually a cell/mobile phone)
     */
    PHONE,
    /**
     * a modem
     */
    MODEM,
    /**
     * a computer, can be a laptop, a wearable computer, etc.
     */
    COMPUTER,
    /**
     * a network device, such as a router
     */
    NETWORK,
    /**
     * a headset (usually a hands-free device)
     */
    HEADSET,
    /**
     * headphones (covers two ears)
     */
    HEADPHONES,
    /**
     * another type of audio device
     */
    OTHER_AUDIO,
    /**
     * a keyboard
     */
    KEYBOARD,
    /**
     * a mouse
     */
    MOUSE,
    /**
     * a camera (still or moving)
     */
    CAMERA,
    /**
     * a printer
     */
    PRINTER,
    /**
     * a joypad, joystick, or other game controller
     */
    JOYPAD,
    /**
     * a drawing tablet
     */
    TABLET,
    /**
     * a video device, such as a webcam
     */
    VIDEO,
    /**
     * a remote control
     */
    REMOTE_CONTROL,
    /**
     * a scanner
     */
    SCANNER,
    /**
     * a display
     */
    DISPLAY,
    /**
     * a wearable computer
     */
    WEARABLE,
    /**
     * a toy or game
     */
    TOY,
    /**
     * audio speaker or speakers
     */
    SPEAKERS,
}
/**
 * Use this value to select any Bluetooth audio device where a #BluetoothType enum is required.
 */
const TYPE_AUDIO: number
/**
 * Use this value to select any Bluetooth input device where a #BluetoothType enum is required.
 */
const TYPE_INPUT: number
/**
 * Returns the type of device corresponding to the given `appearance` value,
 * as usually found in the GAP service.
 * @param appearance a Bluetooth device appearance
 * @returns a #BluetoothType.
 */
function appearance_to_type(appearance: number): Type
/**
 * Returns the type of device corresponding to the given `class` value.
 * @param class_ a Bluetooth device class
 * @returns a #BluetoothType.
 */
function class_to_type(class_: number): Type
/**
 * Start a GUI application for transferring files over Bluetooth.
 * @param address Remote device to use
 * @param alias Remote device's name
 * @returns %TRUE on success, %FALSE on error.
 */
function send_to_address(address: string | null, alias: string | null): boolean
/**
 * Returns a human-readable string representation of `type` usable for display to users. Do not free the return value.
 * The returned string is already translated with gettext().
 * @param type a #BluetoothType
 * @returns a string.
 */
function type_to_string(type: number): string | null
/**
 * Returns a string representing a human-readable (but not usable for display to users) version of the `uuid`. Do not free the return value.
 * @param uuid a string representing a Bluetooth UUID
 * @returns a string.
 */
function uuid_to_string(uuid: string | null): string | null
/**
 * Returns whether the string is a valid Bluetooth address. This does not contact the device in any way.
 * @param bdaddr a string representing a Bluetooth address
 * @returns %TRUE if the address is valid, %FALSE if not.
 */
function verify_address(bdaddr: string | null): boolean
module Client {

    // Signal callback interfaces

    /**
     * Signal callback interface for `device-added`
     */
    interface DeviceAddedSignalCallback {
        ($obj: Client, device: GObject.Object): void
    }

    /**
     * Signal callback interface for `device-removed`
     */
    interface DeviceRemovedSignalCallback {
        ($obj: Client, device: string | null): void
    }


    // Constructor properties interface

    interface ConstructorProperties extends GObject.Object.ConstructorProperties {

        // Own constructor properties of GnomeBluetooth-3.0.GnomeBluetooth.Client

        /**
         * %TRUE if the default Bluetooth adapter is powered.
         */
        default_adapter_powered?: boolean | null
        /**
         * %TRUE if the default Bluetooth adapter is in setup mode (discoverable, and discovering).
         */
        default_adapter_setup_mode?: boolean | null
    }

}

interface Client {

    // Own properties of GnomeBluetooth-3.0.GnomeBluetooth.Client

    /**
     * The D-Bus path of the default Bluetooth adapter or %NULL.
     */
    readonly default_adapter: string | null
    /**
     * The address of the default Bluetooth adapter or %NULL.
     */
    readonly default_adapter_address: string | null
    /**
     * The name of the default Bluetooth adapter or %NULL.
     */
    readonly default_adapter_name: string | null
    /**
     * %TRUE if the default Bluetooth adapter is powered.
     */
    default_adapter_powered: boolean
    /**
     * %TRUE if the default Bluetooth adapter is in setup mode (discoverable, and discovering).
     */
    default_adapter_setup_mode: boolean
    /**
     * The #BluetoothAdapterState of the default Bluetooth adapter. More precise than
     * #BluetoothClient:default-adapter-powered.
     */
    readonly default_adapter_state: AdapterState
    /**
     * The number of detected Bluetooth adapters.
     */
    readonly num_adapters: number

    // Owm methods of GnomeBluetooth-3.0.GnomeBluetooth.Client

    /**
     * This will start the process of connecting to one of the known-connectable
     * services on the device. This means that it could connect to all the audio
     * services on a headset, but just to the input service on a keyboard.
     * 
     * Broadly speaking, this will only have an effect on devices with audio and HID
     * services, and do nothing if the device doesn't have the "connectable"
     * property set.
     * 
     * When the connection operation is finished, `callback` will be called. You can
     * then call bluetooth_client_connect_service_finish() to get the result of the
     * operation.
     * @param path the object path on which to operate
     * @param connect Whether try to connect or disconnect from services on a device
     * @param cancellable optional #GCancellable object, %NULL to ignore
     * @param callback a #GAsyncReadyCallback to call when the connection is complete
     */
    connect_service(path: string | null, connect: boolean, cancellable: Gio.Cancellable | null, callback: Gio.AsyncReadyCallback<this> | null): void
    /**
     * Finishes the connection operation. See bluetooth_client_connect_service().
     * @param res a #GAsyncResult
     * @returns %TRUE if the connection operation succeeded, %FALSE otherwise.
     */
    connect_service_finish(res: Gio.AsyncResult): boolean
    /**
     * Returns an unfiltered #GListStore representing the devices attached to the default
     * Bluetooth adapter.
     * @returns a #GListStore
     */
    get_devices(): Gio.ListStore
    /**
     * Returns whether there are connected devices with the input capability.
     * This can be used by an OS user interface to warn the user before disabling
     * Bluetooth so that the user isn't stranded without any input devices.
     * @returns %TRUE if there are connected input devices.
     */
    has_connected_input_devices(): boolean

    // Own signals of GnomeBluetooth-3.0.GnomeBluetooth.Client

    connect(sigName: "device-added", callback: Client.DeviceAddedSignalCallback): number
    connect_after(sigName: "device-added", callback: Client.DeviceAddedSignalCallback): number
    emit(sigName: "device-added", device: GObject.Object, ...args: any[]): void
    connect(sigName: "device-removed", callback: Client.DeviceRemovedSignalCallback): number
    connect_after(sigName: "device-removed", callback: Client.DeviceRemovedSignalCallback): number
    emit(sigName: "device-removed", device: string | null, ...args: any[]): void

    // Class property signals of GnomeBluetooth-3.0.GnomeBluetooth.Client

    connect(sigName: "notify::default-adapter", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::default-adapter", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::default-adapter", ...args: any[]): void
    connect(sigName: "notify::default-adapter-address", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::default-adapter-address", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::default-adapter-address", ...args: any[]): void
    connect(sigName: "notify::default-adapter-name", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::default-adapter-name", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::default-adapter-name", ...args: any[]): void
    connect(sigName: "notify::default-adapter-powered", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::default-adapter-powered", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::default-adapter-powered", ...args: any[]): void
    connect(sigName: "notify::default-adapter-setup-mode", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::default-adapter-setup-mode", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::default-adapter-setup-mode", ...args: any[]): void
    connect(sigName: "notify::default-adapter-state", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::default-adapter-state", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::default-adapter-state", ...args: any[]): void
    connect(sigName: "notify::num-adapters", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::num-adapters", callback: (($obj: Client, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::num-adapters", ...args: any[]): void
    connect(sigName: string, callback: (...args: any[]) => void): number
    connect_after(sigName: string, callback: (...args: any[]) => void): number
    emit(sigName: string, ...args: any[]): void
    disconnect(id: number): void
}

class Client extends GObject.Object {

    // Own properties of GnomeBluetooth-3.0.GnomeBluetooth.Client

    static name: string
    static $gtype: GObject.GType<Client>

    // Constructors of GnomeBluetooth-3.0.GnomeBluetooth.Client

    constructor(config?: Client.ConstructorProperties) 
    /**
     * Returns a reference to the #BluetoothClient singleton. Use g_object_unref() when done with the object.
     * @constructor 
     * @returns a #BluetoothClient object.
     */
    constructor() 
    /**
     * Returns a reference to the #BluetoothClient singleton. Use g_object_unref() when done with the object.
     * @constructor 
     * @returns a #BluetoothClient object.
     */
    static new(): Client
    _init(config?: Client.ConstructorProperties): void
}

module Device {

    // Constructor properties interface

    interface ConstructorProperties extends GObject.Object.ConstructorProperties {

        // Own constructor properties of GnomeBluetooth-3.0.GnomeBluetooth.Device

        address?: string | null
        alias?: string | null
        battery_level?: number | null
        battery_percentage?: number | null
        battery_type?: BatteryType | null
        connected?: boolean | null
        icon?: string | null
        legacy_pairing?: boolean | null
        name?: string | null
        paired?: boolean | null
        proxy?: Gio.DBusProxy | null
        trusted?: boolean | null
        type?: Type | null
        uuids?: string[] | null
    }

}

interface Device {

    // Own properties of GnomeBluetooth-3.0.GnomeBluetooth.Device

    address: string | null
    alias: string | null
    battery_level: number
    battery_percentage: number
    battery_type: BatteryType
    readonly connectable: boolean
    connected: boolean
    icon: string | null
    legacy_pairing: boolean
    name: string | null
    paired: boolean
    proxy: Gio.DBusProxy
    trusted: boolean
    type: Type
    uuids: string[]

    // Owm methods of GnomeBluetooth-3.0.GnomeBluetooth.Device

    dump(): void
    get_object_path(): string | null
    to_string(): string | null

    // Class property signals of GnomeBluetooth-3.0.GnomeBluetooth.Device

    connect(sigName: "notify::address", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::address", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::address", ...args: any[]): void
    connect(sigName: "notify::alias", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::alias", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::alias", ...args: any[]): void
    connect(sigName: "notify::battery-level", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::battery-level", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::battery-level", ...args: any[]): void
    connect(sigName: "notify::battery-percentage", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::battery-percentage", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::battery-percentage", ...args: any[]): void
    connect(sigName: "notify::battery-type", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::battery-type", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::battery-type", ...args: any[]): void
    connect(sigName: "notify::connectable", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::connectable", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::connectable", ...args: any[]): void
    connect(sigName: "notify::connected", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::connected", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::connected", ...args: any[]): void
    connect(sigName: "notify::icon", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::icon", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::icon", ...args: any[]): void
    connect(sigName: "notify::legacy-pairing", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::legacy-pairing", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::legacy-pairing", ...args: any[]): void
    connect(sigName: "notify::name", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::name", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::name", ...args: any[]): void
    connect(sigName: "notify::paired", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::paired", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::paired", ...args: any[]): void
    connect(sigName: "notify::proxy", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::proxy", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::proxy", ...args: any[]): void
    connect(sigName: "notify::trusted", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::trusted", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::trusted", ...args: any[]): void
    connect(sigName: "notify::type", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::type", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::type", ...args: any[]): void
    connect(sigName: "notify::uuids", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    connect_after(sigName: "notify::uuids", callback: (($obj: Device, pspec: GObject.ParamSpec) => void)): number
    emit(sigName: "notify::uuids", ...args: any[]): void
    connect(sigName: string, callback: (...args: any[]) => void): number
    connect_after(sigName: string, callback: (...args: any[]) => void): number
    emit(sigName: string, ...args: any[]): void
    disconnect(id: number): void
}

class Device extends GObject.Object {

    // Own properties of GnomeBluetooth-3.0.GnomeBluetooth.Device

    static name: string
    static $gtype: GObject.GType<Device>

    // Constructors of GnomeBluetooth-3.0.GnomeBluetooth.Device

    constructor(config?: Device.ConstructorProperties) 
    _init(config?: Device.ConstructorProperties): void
}

interface ClientClass {

    // Own fields of GnomeBluetooth-3.0.GnomeBluetooth.ClientClass

    parent_class: GObject.ObjectClass
}

abstract class ClientClass {

    // Own properties of GnomeBluetooth-3.0.GnomeBluetooth.ClientClass

    static name: string
}

interface DeviceClass {

    // Own fields of GnomeBluetooth-3.0.GnomeBluetooth.DeviceClass

    parent_class: GObject.ObjectClass
}

abstract class DeviceClass {

    // Own properties of GnomeBluetooth-3.0.GnomeBluetooth.DeviceClass

    static name: string
}

/**
 * Name of the imported GIR library
 * @see https://gitlab.gnome.org/GNOME/gjs/-/blob/master/gi/ns.cpp#L188
 */
const __name__: string
/**
 * Version of the imported GIR library
 * @see https://gitlab.gnome.org/GNOME/gjs/-/blob/master/gi/ns.cpp#L189
 */
const __version__: string
}

export default GnomeBluetooth;
// END
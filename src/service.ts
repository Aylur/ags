// @ts-nocheck
import Service from './service/service.js';
import Applications from './service/applications.js';
import Audio from './service/audio.js';
import Battery from './service/battery.js';
import Bluetooth from './service/bluetooth.js';
import Hyprland from './service/hyprland.js';
import Mpris from './service/mpris.js';
import Network from './service/network.js';
import Notifications from './service/notifications.js';

export {
    Applications,
    Audio,
    Battery,
    Bluetooth,
    Hyprland,
    Mpris,
    Network,
    Notifications,
    Service,
};

Service.Applications = Applications;
Service.Audio = Audio;
Service.Battery = Battery;
Service.Bluetooth = Bluetooth;
Service.Hyprland = Hyprland;
Service.Mpris = Mpris;
Service.Network = Network;
Service.Notifications = Notifications;
Service.Service = Service;

export default Service;

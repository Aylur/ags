import Service from './service.js';
declare class BatteryService extends Service {
    private _proxy;
    private _available;
    private _percent;
    private _charging;
    private _charged;
    private _iconName;
    private _timeRemaining;
    private _energy;
    private _energyFull;
    private _energyRate;
    get available(): boolean;
    get percent(): number;
    get charging(): boolean;
    get charged(): boolean;
    get icon_name(): string;
    get time_remaining(): number;
    get energy(): number;
    get energy_full(): number;
    get energy_rate(): number;
    constructor();
    private _sync;
}
export default class Battery {
    static _instance: BatteryService;
    static get instance(): BatteryService;
    static get available(): boolean;
    static get percent(): number;
    static get charging(): boolean;
    static get charged(): boolean;
    static get energy(): number;
    static get iconName(): string;
    static get icon_name(): string;
    static get ['icon-name'](): string;
    static get timeRemaining(): number;
    static get time_remaining(): number;
    static get ['time-remaining'](): number;
    static get energyFull(): number;
    static get energy_full(): number;
    static get ['energy-full'](): number;
    static get energyRate(): number;
    static get energy_rate(): number;
    static get ['energy-rate'](): number;
}
export {};

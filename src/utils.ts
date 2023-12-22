import GLib from 'gi://GLib';
import * as Exec from './utils/exec.js';
import * as File from './utils/file.js';
import * as Etc from './utils/etc.js';
import * as Timeout from './utils/timeout.js';
import * as Fetch from './utils/fetch.js';

export const USER = GLib.get_user_name();
export const CACHE_DIR = `${GLib.get_user_cache_dir()}/${pkg.name.split('.').pop()}`;

export const exec = Exec.exec;
export const execAsync = Exec.execAsync;
export const subprocess = Exec.subprocess;

export const readFile = File.readFile;
export const readFileAsync = File.readFileAsync;
export const writeFile = File.writeFile;
export const monitorFile = File.monitorFile;

export const timeout = Timeout.timeout;
export const interval = Timeout.interval;
export const idle = Timeout.idle;

export const loadInterfaceXML = Etc.loadInterfaceXML;
export const bulkConnect = Etc.bulkConnect;
export const bulkDisconnect = Etc.bulkDisconnect;
export const ensureDirectory = Etc.ensureDirectory;
export const lookUpIcon = Etc.lookUpIcon;

export const fetch = Fetch.fetch;

export default {
    exec, execAsync, subprocess,
    readFile, readFileAsync, writeFile, monitorFile,
    timeout, interval, idle,
    loadInterfaceXML, bulkConnect, bulkDisconnect, ensureDirectory, lookUpIcon,
    fetch,
};

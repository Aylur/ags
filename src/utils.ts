import GLib from 'gi://GLib';
import * as Exec from './utils/exec.js';
import * as File from './utils/file.js';
import * as Etc from './utils/etc.js';
import * as Timeout from './utils/timeout.js';
import * as Fetch from './utils/fetch.js';
import * as Notify from './utils/notify.js';
import * as Pam from './utils/pam.js';
import * as Gobject from './utils/gobject.js';
import * as Binding from './utils/binding.js';

export const USER = GLib.get_user_name();
export const HOME = GLib.get_home_dir();
export const CACHE_DIR = `${GLib.get_user_cache_dir()}/${pkg.name.split('.').pop()}`;

export const {
    exec,
    execAsync,
    subprocess,
} = Exec;

export const {
    readFile,
    readFileAsync,
    writeFile,
    writeFileSync,
    monitorFile,
} = File;

export const {
    timeout,
    interval,
    idle,
} = Timeout;

export const {
    loadInterfaceXML,
    bulkConnect,
    bulkDisconnect,
    ensureDirectory,
    lookUpIcon,
} = Etc;

export const {
    authenticate,
    authenticateUser,
} = Pam;

export const { fetch } = Fetch;
export const { notify } = Notify;

export const {
    kebabify,
    pspec,
    registerGObject,
} = Gobject;

export const {
    merge,
    derive,
    watch,
} = Binding;

export default {
    USER,
    HOME,
    CACHE_DIR,

    exec,
    execAsync,
    subprocess,

    readFile,
    readFileAsync,
    writeFile,
    writeFileSync,
    monitorFile,

    timeout,
    interval,
    idle,

    loadInterfaceXML,
    bulkConnect,
    bulkDisconnect,
    ensureDirectory,
    lookUpIcon,

    fetch,
    notify,

    authenticate,
    authenticateUser,

    kebabify,
    pspec,
    registerGObject,

    merge,
    derive,
    watch,
};

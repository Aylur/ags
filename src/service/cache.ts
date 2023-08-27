import Service from './service.js';
import { ensureDirectory, writeFile, readFile } from '../utils.js';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GdkPixbuf from 'gi://GdkPixbuf';
import { CACHE_DIR } from '../utils.js';

type cacheValue = {
    filePath: string,
    timestamp: number,
};

export class CacheService extends Service {
    static {
        Service.register(this, {
            'cache-changed': ['string', 'string'],
            'cache-repopulated': ['string'],
            'cache-purged': ['string'],
        });
    }

    private cacheLimits: { [key: string]: number } = {};
    private cachePaths: { [key: string]: string } = {};
    private caches: { [key: string]: { [key: string]: cacheValue } } = {};

    newCache(name: string, limit: number) {
        this.cacheLimits[name] = limit;
        this.cachePaths[name] = `${CACHE_DIR}/${name}`;
        this.repopulateCache(name);
    }

    addPath(name: string, fetchPath: string) {
        const key = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA256,
            fetchPath,
            fetchPath.length) + '';

        if (this.caches[name][key]) {
            const err = new Error(`cache ${name} already has key ${key}`);
            logError(err);
            throw err;
        }

        this.caches[name][key] = {
            filePath: `${this.cachePaths[name]}/${key}`,
            timestamp: Date.now(),
        };

        this.writePath(fetchPath, this.caches[name][key].filePath)
            .then(outputPath => {
                this.writeIndex(name);
                this.emit('cache-changed', name, outputPath);
            }).catch(logError);
    }

    addImage(name: string, key: string, pixbuf: GdkPixbuf.Pixbuf) {
        if (this.caches[name][key]) {
            const err = new Error(`cache ${name} already has key ${key}`);
            logError(err);
            throw err;
        }

        this.caches[name][key] = {
            filePath: `${this.cachePaths[name]}/${key}`,
            timestamp: Date.now(),
        };

        this.writeImage(this.caches[name][key].filePath, key, pixbuf);
        this.writeIndex(name);
        this.emit('cache-changed',
            name,
            this.caches[name][key].filePath);
    }

    getPath(name: string, fetchPath: string) {
        const key = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA256,
            fetchPath,
            fetchPath.length) + '';

        if (!this.caches[name][key])
            return '';

        this.updateLastUsed(name, key);
        return this.caches[name][key].filePath;
    }

    getImage(name: string, key: string) {
        if (!this.caches[name][key])
            return null;

        this.updateLastUsed(name, key);

        return GdkPixbuf.Pixbuf.new_from_file(this.caches[name][key].filePath);
    }

    updateImage(name: string, key: string, pixbuf: GdkPixbuf.Pixbuf) {
        if (!this.caches[name][key]) {
            const err = new Error(`cache ${name} does not have key ${key}`);
            logError(err);
            throw err;
        }

        this.caches[name][key] = {
            filePath: `${this.cachePaths[name]}/${key}`,
            timestamp: Date.now(),
        };
        this.writeImage(this.caches[name][key].filePath, key, pixbuf);
        this.writeIndex(name);
        this.emit('cache-changed', name, this.caches[name][key].filePath);
    }

    private writeImage(path: string, key: string, pixbuf: GdkPixbuf.Pixbuf) {
        const output_stream =
            Gio.File.new_for_path(path)
                .replace(null, false, Gio.FileCreateFlags.NONE, null);

        pixbuf.save_to_streamv(output_stream, 'png', null, null, null);
        output_stream.close(null);
    }

    private writePath(path: string, savePath: string): Promise<string> {
        const file = Gio.File.new_for_uri(path);
        return new Promise((resolve, reject) => {
            file.copy_async(
                Gio.File.new_for_path(savePath),
                Gio.FileCopyFlags.OVERWRITE,
                GLib.PRIORITY_DEFAULT,
                null,
                // @ts-ignore
                null,
                // @ts-ignore
                (_, res) => {
                    try {
                        file.copy_finish(res);
                        resolve(savePath);
                    } catch (error) {
                        reject(error);
                    }
                },
            );
        });
    }

    private updateLastUsed(name: string, key: string) {
        if (!this.caches[name][key]) {
            const err = new Error(`cache ${name} does not have key ${key}`);
            logError(err);
            throw err;
        }

        this.caches[name][key].timestamp = Date.now();
        this.writeIndex(name);
    }

    private repopulateCache(name: string) {
        ensureDirectory(this.cachePaths[name]);
        this.caches[name] = {};
        const indexPath = this.cachePaths[name] + '/index';

        if (GLib.file_test(indexPath, GLib.FileTest.EXISTS)) {
            const cacheIndex = readFile(indexPath);
            this.caches[name] = JSON.parse(cacheIndex);
        } else {
            this.writeIndex(name);
        }

        this.emit('cache-repopulated', name);
    }

    private writeIndex(name: string) {
        this.checkAndPurge(name);
        writeFile(JSON.stringify(this.caches[name]),
            this.cachePaths[name] + '/index')
            .catch(logError);
    }

    private checkAndPurge(name: string) {
        if (Object.keys(this.caches[name]).length > this.cacheLimits[name])
            this.cachePurgeOldest(name);
    }

    private cachePurgeOldest(name: string) {
        let oldest = Infinity;
        let oldestKey = '';
        for (const key of Object.keys(this.caches[name])) {
            if (this.caches[name][key].timestamp < oldest) {
                oldest = this.caches[name][key].timestamp;
                oldestKey = key;
            }
        }
        if (!oldestKey)
            return;

        const okc = this.caches[name][oldestKey].filePath;
        delete (this.caches[name][oldestKey]);
        if (GLib.file_test(okc, GLib.FileTest.EXISTS)) {
            const file = Gio.File.new_for_path(okc);
            file.delete_async(GLib.PRIORITY_DEFAULT, null, null);
        }
        this.emit('cache-purged', name);
    }
}

export default class Cache {
    static { Service.export(this, 'Cache'); }
    static _instance: CacheService;

    static get instance() {
        Service.ensureInstance(Cache, CacheService);
        return Cache._instance;
    }

    static NewCache(name: string, limit: number) {
        Cache.instance.newCache(name, limit);
    }

    static AddPath(name: string, fetchPath: string) {
        Cache.instance.addPath(name, fetchPath);
    }

    static AddImage(name: string, key: string, pixbuf: GdkPixbuf.Pixbuf) {
        Cache.instance.addImage(name, key, pixbuf);
    }

    static GetPath(name: string, fetchPath: string) {
        return Cache.instance.getPath(name, fetchPath);
    }

    static GetImage(name: string, key: string) {
        return Cache.instance.getImage(name, key);
    }

    static UpdateImage(name: string, key: string, pixbuf: GdkPixbuf.Pixbuf) {
        Cache.instance.updateImage(name, key, pixbuf);
    }

    static Connect(signal: string, callback: (...args: any[]) => void) {
        Cache.instance.connect(signal, callback);
    }
}

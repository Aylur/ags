//@ts-expect-error missing types
import GUtils from 'gi://GUtils';
import Gio from 'gi://Gio';

export function authenticate(password: string) {
    return new Promise((resolve, reject) => {
        GUtils.authenticate(password, 0, null, (_: unknown, res: Gio.AsyncResult) => {
            try {
                resolve(GUtils.authenticate_finish(res));
            }
            catch (e) {
                reject(e);
            }
        });
    });
}

export function authenticateUser(username: string, password: string) {
    return new Promise((resolve, reject) => {
        GUtils.authenticate_user(
            username, password, 0, null, (_: unknown, res: Gio.AsyncResult) => {
                try {
                    resolve(GUtils.authenticate_finish(res));
                }
                catch (e) {
                    reject(e);
                }
            });
    });
}

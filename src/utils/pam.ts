//@ts-expect-error missing types
import Pam from 'gi://Pam';
import Gio from 'gi://Gio';

export function authenticate(password: string) {
    return new Promise((resolve, reject) => {
        Pam.authenticate(password, 0, null, (_: unknown, res: Gio.AsyncResult) => {
            try {
                resolve(Pam.authenticate_finish(res));
            }
            catch (e) {
                reject(e);
            }
        });
    });
}

export function authenticateUser(username: string, password: string) {
    return new Promise((resolve, reject) => {
        Pam.authenticate_user(username, password, 0, null, (_: unknown, res: Gio.AsyncResult) => {
            try {
                resolve(Pam.authenticate_finish(res));
            }
            catch (e) {
                reject(e);
            }
        });
    });
}

//@ts-ignore
import Pam from 'gi://Pam';
import Gio from 'gi://Gio';

export function authenticate(password: string) {
    return new Promise((resolve, reject) => {
        Pam.authenticate(password, 0, null, (obj: any, res: Gio.AsyncResult) => {
            try {
                resolve(Pam.authenticate_finish(res));
            }
            catch (e) {
                reject(e);
            }
        });
    });
}

export function authenticate_user(username: string, password: string) {
    return new Promise((resolve, reject) => {
        Pam.authenticate_user(username, password, 0, null, (obj: any, res: Gio.AsyncResult) => {
            try {
                resolve(Pam.authenticate_finish(res));
            }
            catch (e) {
                reject(e);
            }
        });
    });
}

//@ts-ignore
import Pam from 'gi://Pam';

export function authenticate(password: string) {
    return new Promise((resolve, reject) => {
        Pam.authenticate(password, 0, null, (obj: any, res: any, data: any) => {
            try {
                resolve(Pam.authenticate_finish(res));
            }
            catch(e) {
                reject(e);
            }
        })
    })
}

export function authenticate_user(username: string, password: string) {
    return new Promise((resolve, reject) => {
        Pam.authenticate_user(username, password, 0, null, (obj: any, res: any, data: any) => {
            try {
                resolve(Pam.authenticate_finish(res));
            }
            catch(e) {
                reject(e);
            }
        })
    })
}

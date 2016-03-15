import * as AuthService from './auth.service';
import * as AuthModel from './auth.model';


export function login() {
    return AuthService.login();
}

export function logout() {
    return AuthService.logout();
}

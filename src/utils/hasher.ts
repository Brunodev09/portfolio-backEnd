import CryptoJS from "crypto-js";

export default class Password {

    pass1: string;
    pass2: string;

    constructor(pass1, pass2) {
        this.pass1 = pass1;
        this.pass2 = Password.enc(pass2);
    }

    static enc(pass): string {
        pass = CryptoJS.SHA512(pass);
        return CryptoJS.enc.Base64.stringify(pass);
    }

    match(): boolean {
        return this.pass1 === this.pass2;
    }
}

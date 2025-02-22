"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientSSLSecurityPFX = void 0;
const fs = require("fs");
const https = require("https");
const _ = require("lodash");
/**
 * activates SSL for an already existing client using a PFX cert
 *
 * @module ClientSSLSecurityPFX
 * @param {Buffer|String}   pfx
 * @param {String}   passphrase
 * @constructor
 */
class ClientSSLSecurityPFX {
    constructor(pfx, passphrase, defaults) {
        if (typeof passphrase === 'object') {
            defaults = passphrase;
        }
        if (pfx) {
            if (Buffer.isBuffer(pfx)) {
                this.pfx = pfx;
            }
            else if (typeof pfx === 'string') {
                this.pfx = fs.readFileSync(pfx);
            }
            else {
                throw new Error('supplied pfx file should be a buffer or a file location');
            }
        }
        if (passphrase) {
            if (typeof passphrase === 'string') {
                this.passphrase = passphrase;
            }
        }
        this.defaults = {};
        _.merge(this.defaults, defaults);
    }
    toXML() {
        return '';
    }
    addOptions(options) {
        options.pfx = this.pfx;
        if (this.passphrase) {
            options.passphrase = this.passphrase;
        }
        _.merge(options, this.defaults);
        options.httpsAgent = new https.Agent(options);
    }
}
exports.ClientSSLSecurityPFX = ClientSSLSecurityPFX;
//# sourceMappingURL=ClientSSLSecurityPFX.js.map
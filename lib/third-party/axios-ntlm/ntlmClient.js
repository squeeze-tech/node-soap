"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NtlmClient = exports.AxiosError = void 0;
const axios_1 = require("axios");
Object.defineProperty(exports, "AxiosError", { enumerable: true, get: function () { return axios_1.AxiosError; } });
const ntlm = require("./ntlm");
const https = require("https");
const http = require("http");
const dev_null_1 = require("dev-null");
/**
 * @param credentials An NtlmCredentials object containing the username and password
 * @param AxiosConfig The Axios config for the instance you wish to create
 *
 * @returns This function returns an axios instance configured to use the provided credentials
 */
function NtlmClient(credentials, AxiosConfig) {
    let config = AxiosConfig !== null && AxiosConfig !== void 0 ? AxiosConfig : {};
    if (!config.httpAgent) {
        config.httpAgent = new http.Agent({ keepAlive: true });
    }
    if (!config.httpsAgent) {
        config.httpsAgent = new https.Agent({ keepAlive: true });
    }
    const client = axios_1.default.create(config);
    client.interceptors.response.use((response) => {
        return response;
    }, (err) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const error = err.response;
        if (error &&
            error.status === 401 &&
            error.headers["www-authenticate"] &&
            error.headers["www-authenticate"].includes("NTLM") &&
            (!error.config.headers["X-retry"] ||
                error.config.headers["X-retry"] !== "false")) {
            // The header may look like this: `Negotiate, NTLM, Basic realm="itsahiddenrealm.example.net"`
            // so extract the 'NTLM' part first
            const ntlmheader = ((_a = error.headers["www-authenticate"]
                .split(",")
                .find((header) => header.match(/ *NTLM/))) === null || _a === void 0 ? void 0 : _a.trim()) || "";
            // This length check is a hack because SharePoint is awkward and will
            // include the Negotiate option when responding with the T2 message
            // There is nore we could do to ensure we are processing correctly,
            // but this is the easiest option for now
            if (!error.config.headers) {
                error.config.headers = {};
            }
            if (ntlmheader.length < 50) {
                const t1Msg = ntlm.createType1Message(credentials.workstation, credentials.domain);
                error.config.headers["Authorization"] = t1Msg;
            }
            else {
                const t2Msg = ntlm.decodeType2Message((ntlmheader.match(/^NTLM\s+(.+?)(,|\s+|$)/) || [])[1]);
                const t3Msg = ntlm.createType3Message(t2Msg, credentials.username, credentials.password, credentials.workstation, credentials.domain);
                error.config.headers["X-retry"] = "false";
                error.config.headers["Authorization"] = t3Msg;
            }
            if (error.config.responseType === "stream") {
                const stream = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data;
                // Read Stream is holding HTTP connection open in our
                // TCP socket. Close stream to recycle back to the Agent.
                // @ts-expect-error
                if (stream && !stream.readableEnded) {
                    yield new Promise((resolve) => {
                        stream.pipe((0, dev_null_1.default)());
                        stream.once("close", resolve);
                    });
                }
            }
            return client(error.config);
        }
        else {
            throw err;
        }
    }));
    return client;
}
exports.NtlmClient = NtlmClient;
//# sourceMappingURL=ntlmClient.js.map
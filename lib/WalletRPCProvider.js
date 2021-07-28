"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRPCProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const Encoder = require("Sweb3");
class WalletRPCProvider {
    constructor(wallet) {
        this.wallet = wallet;
    }
    rawCall(method, params = [], opts = {}) {
        const [contractAddress, encodedData, 
        // these are optionals
        amount, gasLimit, gasPrice,] = params;
        // The underlying sbercoinjs-wallet API expects gasPrice and amount to be specified in sat
        const gasPriceInGreph = Math.floor((gasPrice || 0.0000004) * 1e7);
        const amountInGreph = Math.floor((amount || 0) * 1e7);
        opts = Object.assign(Object.assign({}, opts), { amount: amountInGreph, gasLimit: gasLimit || 200000, gasPrice: gasPriceInGreph });
        switch (method.toLowerCase()) {
            case "sendtocontract":
                return this.wallet.contractSend(contractAddress, encodedData, opts);
            case "callcontract":
                return this.wallet.contractCall(contractAddress, encodedData, Encoder.addressToHex(this.wallet.address), opts);
            default:
                throw new Error("Unknow method call");
        }
    }
    cancelTokenSource() {
        return axios_1.default.CancelToken.source();
    }
}
exports.WalletRPCProvider = WalletRPCProvider;
//# sourceMappingURL=WalletRPCProvider.js.map
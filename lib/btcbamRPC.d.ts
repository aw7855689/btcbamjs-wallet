import RpcClient, { IConfig } from "btcbamd-rpc";
import { Network } from "./Network";
export default class BtcbamRPC {
    rpc: RpcClient;
    constructor(config?: IConfig);
    generate(nblocks: number): Promise<any>;
}
export declare const rpcClient: BtcbamRPC;
export declare function generateBlock(network: Network): Promise<void>;

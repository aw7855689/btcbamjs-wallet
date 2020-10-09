import RpcClient, { IConfig } from "sbercoind-rpc";
import { Network } from "./Network";
export default class SbercoinRPC {
    rpc: RpcClient;
    constructor(config?: IConfig);
    generate(nblocks: number): Promise<any>;
}
export declare const rpcClient: SbercoinRPC;
export declare function generateBlock(network: Network): Promise<void>;

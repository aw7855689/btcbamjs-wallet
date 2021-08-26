import { IProvider } from "./Provider"
import axios, { CancelTokenSource } from "axios"
import { Insight } from "./Insight"
import { Wallet } from "./Wallet"
import {Encoder} from "bweb3js"

export class WalletRPCProvider implements IProvider {

  constructor(public wallet: Wallet) { }

  public rawCall(
    method: string,
    params: any[] = [],
    opts: any = {}): Promise<Insight.IContractCall | Insight.ISendRawTxResult> {
    const [
      contractAddress,
      encodedData,
      // these are optionals
      amount,
      gasLimit,
      gasPrice,
    ] = params

    // The underlying bamswapjs-wallet API expects gasPrice and amount to be specified in sat
    const gasPriceInGreph = Math.floor((gasPrice || 0.0000004) * 1e7)
    const amountInGreph = Math.floor((amount || 0) * 1e7)

    opts = {
      ...opts,
      amount: amountInGreph,
      gasLimit: gasLimit || 200000,
      gasPrice: gasPriceInGreph,
    }

    switch (method.toLowerCase()) {
      case "sendtocontract":
        return this.wallet.contractSend(contractAddress, encodedData, opts)
      case "callcontract":
        return this.wallet.contractCall(contractAddress, encodedData, Encoder.addressToHex(this.wallet.address).substring(24), opts)
      default:
        throw new Error("Unknow method call")
    }
  }

  public cancelTokenSource(): CancelTokenSource {
    return axios.CancelToken.source()
  }

}

import axios, { AxiosInstance } from "axios"

import { INetworkInfo } from "./Network"
import { NetworkNames } from "./constants"

const INSIGHT_BASEURLS: { [key: string]: string } = {
  [NetworkNames.MAINNET]: "https://explorer.sbercoin.com/api",
  [NetworkNames.TESTNET]: "https://testnet.sbercoin.com/insight-api",
  [NetworkNames.REGTEST]: "http://localhost:3001/insight-api",
}

export class Insight {
  // public static mainnet(): Insight {
  //   return new Insight(MAINNET_API_BASEURL)
  // }

  // public static testnet(): Insight {
  //   return new Insight(TESTNET_API_BASEURL)
  // }

  public static forNetwork(network: INetworkInfo): Insight {
    const baseURL = INSIGHT_BASEURLS[network.name]
    if (baseURL == null) {
      throw new Error(`No Insight API defined for network: ${network.name}`)
    }

    return new Insight(baseURL)
  }

  private axios: AxiosInstance

  constructor(private baseURL: string) {
    this.axios = axios.create({
      baseURL,
      // don't throw on non-200 response
      // validateStatus: () => true,
    })
  }

  public async listUTXOs(address: string): Promise<Insight.IUTXO[]> {
    const res = await this.axios.get(`/address/${address}/utxo`)
    return res.data
  }

  public async getInfo(address: string): Promise<Insight.IGetInfo> {
    const res = await this.axios.get(`/address/${address}`)
    return res.data
  }

  public async sendRawTx(rawtx: string): Promise<Insight.ISendRawTxResult> {
    const res = await this.axios.post('/tx/send', {
      rawtx,
    }).then((response: {data: Promise<Insight.ISendRawTxResult>}) => {
      return response.data
    })
    return res
  }

  public async contractCall(
    address: string,
    encodedData: string,
    sender: string //hexAddress
  ): Promise<Insight.IContractCall> {
    // FIXME wow, what a weird API design... maybe we should just host the RPC
    // server, with limited API exposed.
    if (sender.length != 40)
      sender = '0000000000000000000000000000000000000000'
      
    const res = await this.axios.get(
      `/contract/${address}/call?data=${encodedData}&sender=${sender}`,
    )

    return res.data
  }

  /**
   * Estimate the fee per KB of txdata, in greph. Returns -1 if no estimate is
   * available. It always return -1 for testnet.
   *
   * @param nblocks
   */
  public async estimateFee(nblocks: number = 6): Promise<any> {
    const res = await this.axios.get('/info').then(function (response: {data: {feeRate: number}}) {
      
      return response.data.feeRate
    })
    const feeRate: number = res
    if (typeof feeRate !== "number" || feeRate < 0) {
      return -1
    }

    return Math.ceil(feeRate * 1e7)
  }

  /**
   * Estimate the fee per byte of txdata, in greph. Returns -1 if no estimate is
   * available. It always return -1 for testnet.
   *
   * @param nblocks
   */
  public async estimateFeePerByte(nblocks: number = 6): Promise<any> {
    const feeRate = await this.estimateFee()

    if (feeRate < 0) {
      return feeRate
    }

    return Math.ceil(feeRate / 1024)
  }

  /**
   * Get single transaction's info
   * @param id
   */
  public async getTransactionInfo(
    id: string,
  ): Promise<Insight.IRawTransactionInfo> {
    const res = await this.axios.get(`/tx/${id}`)
    return res.data as Insight.IRawTransactionInfo
  }

  /**
   * Get multiple Transaction info (paginated)
   * @param address
   * @param pageNum
   */
  public async getTransactions(
    address: string,
    pageNum: number = 0,
  ): Promise<Insight.IRawTransactions> {
    const result = await this.axios.get(`/address/${address}/basic-txs?pageSize=10&page=${pageNum}`)
    return result.data as Insight.IRawTransactions
  }
}

export namespace Insight {
  export type Foo = string

  export interface ISendRawTxResult {
    id: string
    status: number
  }

  export interface IUTXO {
    address: string
    transactionId: string
    outputIndex: number

    /**
     * Public key that controls this UXTO, as hex string.
     */
    scriptPubKey: string

    value: number

    isStake: boolean
    height: number
    confirmations: number
  }

  export interface IExecutionResult {
    gasUsed: number
    excepted: string
    newAddress: string
    output: string
    codeDeposit: number
    gasRefunded: number
    depositSize: number
    gasForDeposit: number
  }

  export interface ITransactionReceipt {
    sender: string
    contractAddress: string
    gasUsed: number
    excepted: string
    log: any[]
  }

  export interface IContractCall {
    address: string
    executionResult: any
  }

  export interface IGetInfo {
    addrStr: string

    /**
     * Balance of address in greph
     */
     balance: number
     coinBalance: number;
     totalReceived: number
     totalCoinReceived: number
     totalSent: number
     totalCoinSent: number

    unconfirmed: number

    /**
     * List of transaction IDs
     */
    transactions: string[]
  }

  export interface IVin {
    prevTxId: string
    address: string // 执行转出的钱包地址
  }

  export interface IVout {
    value: string
    scriptPubKey: IScriptPubKey
    receipt: ITransactionReceipt
  }

  export interface IScriptPubKey {
    addresses: string[]
  }

  export interface IQRC20Transfer {
    address: string
    name: string
    symbol: string
    decimals: number
    from: string
    to: string
    value: string
  }

  export interface IRawTransactionInfo {
    id: string
    version: number
    locktime: number
    //receipt: ITransactionReceipt[]
    inputs: IVin[] // 入账，[交易, ...]
    outputs: IVout[] // 出账，[交易, ...]
    confirmations: number
    timestamp: number
    outputValue: number // 扣除手续费的余额（发送方）
    inputValue: number // 交易前余额（发送方）
    fees: number // 手续费
    blockhash: string
    blockheight: number
    qrc20TokenTransfers: IQRC20Transfer[]
  }

  export interface IRawTransactionBasicInfo {
    id: string
    blockheight: number
    blockhash: string
    timestamp: number
    confirmations: number
    amount: number
    inputvalue: number
    outputvalue: number
    fees: number
    type: string
  }

  export interface IRawTransactions {
    totalCount: number
    transactions: IRawTransactionBasicInfo[]
  }
}

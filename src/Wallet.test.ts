import { assert } from "chai"

import { networks, generateMnemonic, NetworkNames } from "./"
import { generateBlock } from "./btcbamRPC"
import { sleep } from "./time"
import { params } from "./scrypt"

describe("Wallet", () => {
  const network = networks.regtest

  it("generates mnemonic of 12 words", () => {
    const mnemonic = generateMnemonic()
    assert.isString(mnemonic)

    const words = mnemonic.split(" ")
    assert.equal(words.length, 12)
  })

  const testMnemonic = "behind lunar size snap unfold stereo case shift flavor shove cricket divorce"
  const password = "covfefe"

  it("recovers wallet from mnemonic", async () => {
    const wallet = await network.fromMnemonic(testMnemonic)
    assert.equal(wallet.address, "sPVw7ZSjV8G2Xdr6rtxhR2riWf9SDkzDVo")
  })

  it("recovers wallet from mnemonic with password", async () => {
    const wallet = await network.fromMnemonic(testMnemonic, password)

    assert.equal(wallet.address, "sJSUjMyHRZ4J1DmsCKd4R14cmb8CAWLZG8")
  })

  const wifPrivateKey = "cMbgxCJrTYUqgcmiC1berh5DFrtY1KeU4PXZ6NZxgenniF1mXCRk"

  it("recovers wallet from WIF", () => {
    const wallet = network.fromWIF(wifPrivateKey)

    assert.equal(wallet.address, "sUbxboqjBRp96j3La8D1RYkyqx5uQbJPoW")
  })

  it("recovers wallet from EncryptedPrivateKey", () => {
    const wif = "cNQKccYYQyGX9G9Qxq2DJev9jHygbZpb2UG7EvUapbtDx5XhkhYE"
    const encryptPassword = "testtest"

    const wallet = network.fromWIF(wif)

    const encryptedKey = wallet.toEncryptedPrivateKey(encryptPassword, params.noop)

    const wallet2 = network.fromEncryptedPrivateKey(encryptedKey, encryptPassword, params.noop)

    assert.equal(wallet2.toWIF(), wif)
  })

  it("dumps wallet to WIF", () => {
    const wallet = network.fromWIF(wifPrivateKey)

    assert.equal(wallet.toWIF(), wifPrivateKey)
  })

  it("gets wallet info", async function () {
    this.timeout(10000)

    const wallet = network.fromWIF(wifPrivateKey)

    const info = await wallet.getInfo()
    assert.containsAllKeys(info, [
      "addrStr",
      "balance",
      "coinBalance",
      "totalReceived",
      "totalCoinReceived",
      "totalSent",
      "totalCoinSent",
      "transactions",
    ])
  })

  it("gets wallet transactions", async function () {
    this.timeout(10000)

    const wallet = network.fromWIF(wifPrivateKey)

    const rawTxs = await wallet.getTransactions()

    assert.containsAllKeys(rawTxs, ["transactions", "totalCount"])
    assert.isArray(rawTxs.transactions)
  })

  it("sends payment to a receiving address", async function () {
    this.timeout(20000)

    const insight = network.insight()
    const wallet = network.fromWIF(wifPrivateKey)

    const toAddress = "sLn9vqbr2Gx3TsVR9QyTVB5mrMoh4x43Uf"
    const amount = 1e7 // 1 BTCBAM (in greph)

    const senderOldInfo = await insight.getInfo(wallet.address)
    const receiverOldInfo = await insight.getInfo(toAddress)

    const tx = await wallet.send(toAddress, amount, {
      feeRate: 4000, // 0.04 BTCBAM / KB
    })
    assert.isNotEmpty(tx.id)

    await generateBlock(network)
    await sleep(2000)

    const senderNewInfo = await insight.getInfo(wallet.address)
    const receiverNewInfo = await insight.getInfo(toAddress)

    assert.equal(senderOldInfo.coinBalance - senderNewInfo.coinBalance, Math.round(1.009 * 1e7), "sender")
    assert.equal(receiverNewInfo.coinBalance - receiverOldInfo.coinBalance, 1e7, "receiver")
  })
})

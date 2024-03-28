import {
  AccountUpdate,
  Encoding,
  Field,
  Mina,
  PrivateKey,
  ProvablePure,
  PublicKey,
  Signature,
  SmartContract,
  UInt32,
  UInt64,
  provablePure,
} from 'o1js';

import { JSONPath } from 'jsonpath-plus';

import {
  IOracleClient, IOracleData,
  IOracleEvents,
  OracleContract,
} from './OracleContract.js';
import { OracleRequest } from '../gen/oracle-request_pb.js';
import {
  BasicRequestClient,
  buildOracleRequestTxWithAddr,
  // buildBasicRequestClient,
  buildOracleRequestTx, buildTransferAndCallTx,
} from './BasicRequestClient.js';
import { IERC677, buildERC677Contract, SErc677Contract } from '../token/Erc677Token.js';
import { Toolkit } from '../Toolkit';

let player1: PublicKey,
  player1Key: PrivateKey,
  player2: PublicKey,
  player2Key: PrivateKey,
  zkAppClientAddress: PublicKey,
  zkAppClientPrivateKey: PrivateKey,
  zkAppOracleAddress: PublicKey,
  zkAppOraclePrivateKey: PrivateKey,
  erc677TokenAddress: PublicKey,
  erc677TokenPrivateKey: PrivateKey,
  serc677TokenAddress: PublicKey,
  serc677TokenPrivateKey: PrivateKey;

let tokenId: Field;
let tokenSErc677Id: Field;
// let zkAppErc677: SmartContract & IERC677;
let zkAppSErc677: SErc677Contract;
let zkAppClient: SmartContract & IOracleClient;
let zkAppOracle: OracleContract;

async function setupAccounts() {
  let Local = Mina.LocalBlockchain({
    proofsEnabled: true,
    enforceTransactionLimits: false,
  });
  Mina.setActiveInstance(Local);
  player1Key = Local.testAccounts[0].privateKey;
  player1 = Local.testAccounts[0].publicKey;

  // player2Key = Local.testAccounts[1].privateKey;
  // player2 = Local.testAccounts[1].publicKey;
  //
  // erc677TokenPrivateKey = PrivateKey.random();
  // erc677TokenAddress = erc677TokenPrivateKey.toPublicKey();

  // zkAppErc677 = await buildERC677Contract(
  //   erc677TokenAddress,
  //   'SomeCoin',
  //   'PZZ',
  //   9
  // );
  // tokenErc677Id = zkAppErc677.token.id;


  serc677TokenPrivateKey = PrivateKey.random();
  serc677TokenAddress = serc677TokenPrivateKey.toPublicKey();

  zkAppSErc677 = new SErc677Contract(serc677TokenAddress);
  tokenSErc677Id = zkAppSErc677.token.id;

  zkAppOracle = new OracleContract(zkAppOracleAddress);

  zkAppOraclePrivateKey = PrivateKey.random();
  zkAppOracleAddress = zkAppOraclePrivateKey.toPublicKey();

  zkAppOracle = new OracleContract(zkAppOracleAddress);

  zkAppClientPrivateKey = PrivateKey.random();
  zkAppClientAddress = zkAppClientPrivateKey.toPublicKey();

  // zkAppClient = await buildBasicRequestClient(
  //   zkAppClientAddress,
  //   zkAppOracleAddress
  // );

  zkAppClient = new BasicRequestClient(zkAppClientAddress);
}

async function setupLocal() {
  let tx1 = await Mina.transaction(player1, () => {
    let feePayerUpdate = AccountUpdate.fundNewAccount(player1);
    feePayerUpdate.send({
      to: zkAppClientAddress,
      amount: Mina.getNetworkConstants().accountCreationFee,
    });
    zkAppClient.deploy();
  });
  await tx1.prove();
  tx1.sign([zkAppClientPrivateKey, zkAppOraclePrivateKey, player1Key]);
  await tx1.send();

  let tx2 = await Mina.transaction(player1, () => {
    let feePayerUpdate = AccountUpdate.fundNewAccount(player1);
    feePayerUpdate.send({
      to: zkAppOracleAddress,
      amount: Mina.getNetworkConstants().accountCreationFee,
    });
    zkAppOracle.deploy();
  });
  await tx2.prove();
  tx2.sign([zkAppOraclePrivateKey, player1Key]);
  await tx2.send();

  let tx3 = await Mina.transaction(player1, () => {
    let feePayerUpdate = AccountUpdate.fundNewAccount(player1);
    feePayerUpdate.send({
      to: serc677TokenAddress,
      amount: Mina.getNetworkConstants().accountCreationFee,
    });
    zkAppSErc677.deploy();
  });
  await tx3.prove();
  tx3.sign([serc677TokenPrivateKey, player1Key]);
  await tx3.send();
}

describe('BasicRequestClient SmartContract', () => {
  beforeAll(async () => {
    await SErc677Contract.compile();
    await OracleContract.compile();
    await BasicRequestClient.compile();
  });

  describe("Send BasicRequest to 'OracleRequest()'", () => {
    beforeEach(async () => {

      await setupAccounts();
      await setupLocal();
    });

    test('should got oracleRequestWithAddr event from on-chain tx, then fetch ETH price and fulfillOracle', async () => {
      // BasicRequest from Client to Oracle 'OracleRequest'
      let req1 = new OracleRequest({
        protocol: 'http',
        method: 'get',
        url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD',
        path: 'RAW.ETH.USD.PRICE',
      });

      const offChainBytes = req1.toBinary();
      const ReqField = Encoding.bytesToFields(offChainBytes);

      // Pass oracleAddr to buildOracleRequestTx
      let tx = await buildOracleRequestTxWithAddr(
        { sender: player1 },
        zkAppOracleAddress,
        zkAppClient,
        req1
      );

      await tx.prove();
      tx.sign([player1Key, zkAppClientPrivateKey]);
      await tx.send();

      // Fetcher got Event and filter OracleRequest.
      const events = await zkAppOracle.fetchEvents(UInt32.from(0));

      expect(events[0].type).toEqual('OracleRequest');

      // await displayEvents(zkAppOracle);

      interface OracleData {
        sender: string;
        req0: string;
        req1: string;
        req2: string;
        req3: string;
      }

      // Reparse from jsonStringify (event.data)
      const r: OracleData = JSON.parse(JSON.stringify(events[0].event.data));

      const onOracleReq = [
        Field.fromJSON(r.req0),
        Field.fromJSON(r.req1),
        Field.fromJSON(r.req2),
        Field.fromJSON(r.req3),
      ];

      const onOracleDataBytes = Encoding.bytesFromFields(onOracleReq);
      const req2 = OracleRequest.fromBinary(onOracleDataBytes);

      expect(ReqField).toEqual(onOracleReq);
      expect(req1).toEqual(req2);

      // Off chain processing
      const response = await fetch(req2.url);
      const data = await response.json();
      const result = JSONPath({ path: req2.path, json: data });

      // Scale float value to int
      const r10000 = Math.floor((result[0] * 10000) as number);

      // Sign FeedData
      const signatureFeed = Signature.create(zkAppOraclePrivateKey, [
        Field(r10000),
      ]);

      // Send fulfillOracleRequest()
      const txnFeed = await Mina.transaction(player1, () => {
        zkAppOracle.fulfillOracleRequest(
          zkAppClientAddress,
          Field(r10000),
          signatureFeed
        );
      });

      await txnFeed.prove();
      txnFeed.sign([player1Key, zkAppOraclePrivateKey]);
      await txnFeed.send();

      const feedData = zkAppClient.data0.get();
      expect(feedData).toEqual(Field(r10000));

      console.log(`request ${req2.url}
       - offchain-value '${req2.path}' = ${r10000 / 10000}
       - onchain-value '${req2.path}' = ${
        Number(feedData.toBigInt()) / 10000
      }`);
    });

    test('should got oracleRequest event from on-chain tx, then fetch MINA price and fulfillOracle', async () => {
      // Set OracleContract on Client
      const txnSet = await Mina.transaction(player1, () => {
        zkAppClient.setOracleContract(zkAppOracleAddress);
      });

      await txnSet.prove();
      txnSet.sign([player1Key, zkAppClientPrivateKey]);
      await txnSet.send();

      const oracleAddr =  zkAppClient.oracleAddress.get();
      expect(oracleAddr).toEqual(zkAppOracleAddress);

      // BasicRequest from Client to Oracle 'OracleRequest'
      let req1 = new OracleRequest({
        protocol: 'http',
        method: 'get',
        url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=MINA&tsyms=USD',
        path: 'RAW.MINA.USD.PRICE',
      });

      const offChainBytes = req1.toBinary();
      const ReqField = Encoding.bytesToFields(offChainBytes);

      let tx = await buildOracleRequestTx(
        { sender: player1 },
        zkAppClient,
        req1
      );

      await tx.prove();
      tx.sign([player1Key, zkAppClientPrivateKey]);
      await tx.send();

      // Fetcher got Event and filter OracleRequest.
      const events = await zkAppOracle.fetchEvents(UInt32.from(0));

      expect(events[0].type).toEqual('OracleRequest');

      // await displayEvents(zkAppOracle);

      // Reparse from jsonStringify (event.data)
      const r: IOracleData = JSON.parse(JSON.stringify(events[0].event.data));

      const onOracleReq = [
        Field.fromJSON(r.req0),
        Field.fromJSON(r.req1),
        Field.fromJSON(r.req2),
        Field.fromJSON(r.req3),
      ];

      const onOracleDataBytes = Encoding.bytesFromFields(onOracleReq);
      const req2 = OracleRequest.fromBinary(onOracleDataBytes);

      expect(ReqField).toEqual(onOracleReq);
      expect(req1).toEqual(req2);

      // Off chain processing
      const response = await fetch(req2.url);
      const data = await response.json();
      const result = JSONPath({ path: req2.path, json: data });

      // Scale float value to int
      const r10000 = Math.floor((result[0] * 10000) as number);

      // Sign FeedData
      const signatureFeed = Signature.create(zkAppOraclePrivateKey, [
        Field(r10000),
      ]);

      // Send fulfillOracleRequest()
      const txnFeed = await Mina.transaction(player1, () => {
        zkAppOracle.fulfillOracleRequest(
          zkAppClientAddress,
          Field(r10000),
          signatureFeed
        );
      });

      await txnFeed.prove();
      txnFeed.sign([player1Key, zkAppOraclePrivateKey]);
      await txnFeed.send();

      // Test onChain on Client
      const feedData = await zkAppClient.data0.get();
      expect(feedData).toEqual(Field(r10000));

      console.log(`request ${req2.url}
      - offchain-value '${req2.path}' = ${r10000 / 10000}
      - onchain-value '${req2.path}' = ${Number(feedData.toBigInt()) / 10000}`);
    });
  });

  describe("Send TransferAndCall to 'OracleRequest()'", () => {
    beforeEach(async () => {
      await setupAccounts();
      await setupLocal();
    });

    test('should got oracleRequest event from on-chain tx, then fetch BTC price and fulfillOracle', async () => {


      // Set OracleContract on Client
      const txnSet = await Mina.transaction(player1, () => {
        zkAppClient.setErc677Token(serc677TokenAddress);
        zkAppClient.setOracleContract(zkAppOracleAddress);
      });

      // MINT

      await txnSet.prove();
      txnSet.sign([player1Key, zkAppClientPrivateKey]);
      await txnSet.send();

      const tokenAddr = zkAppClient.tokenAddress.get();
      expect(tokenAddr).toEqual(serc677TokenAddress);

      const oracleAddr = zkAppClient.oracleAddress.get();
      expect(oracleAddr).toEqual(zkAppOracleAddress);

      // BasicRequest from Client to Oracle 'OracleRequest'
      let req1 = new OracleRequest({
        protocol: 'http',
        method: 'get',
        url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC&tsyms=USD',
        path: 'RAW.BTC.USD.PRICE',
      });

      const offChainBytes = req1.toBinary();
      const ReqField = Encoding.bytesToFields(offChainBytes);

      let tx = await buildTransferAndCallTx(
        { sender: player1 },
        zkAppClient,
        req1
      );

      await tx.prove();
      tx.sign([player1Key, zkAppClientPrivateKey]);
      await tx.send();

      // console.log("Player1="+player1.toBase58())
      // console.log("Client="+zkAppClientAddress.toBase58())
      // console.log("Token="+serc677TokenAddress.toBase58())
      // console.log("Oracle="+zkAppOracleAddress.toBase58())

      await Toolkit.displayEvents(zkAppOracle,UInt32.from(0));

      // const eventsTokenContract = await zkAppSErc677.fetchEvents(UInt32.from(0));
      // expect(eventsTokenContract[0].type).toEqual('TransferAndCall');

      // Fetcher got Event and filter OracleRequest.
      const eventsOracle = await zkAppOracle.fetchEvents(UInt32.from(0));

      expect(eventsOracle[0].type).toEqual('OracleRequest');

      // Reparse from jsonStringify (event.data)
      const r: IOracleData = JSON.parse(JSON.stringify(eventsOracle[0].event.data));

      const onOracleReq = [
        Field.fromJSON(r.req0),
        Field.fromJSON(r.req1),
        Field.fromJSON(r.req2),
        Field.fromJSON(r.req3),
      ];

      const onOracleDataBytes = Encoding.bytesFromFields(onOracleReq);
      const req2 = OracleRequest.fromBinary(onOracleDataBytes);

      expect(ReqField).toEqual(onOracleReq);
      expect(req1).toEqual(req2);

      // Off chain processing
      const response = await fetch(req2.url);
      const data = await response.json();
      const result = JSONPath({ path: req2.path, json: data });

      // Scale float value to int
      const r10000 = Math.floor((result[0] * 10000) as number);

      // Sign FeedData
      const signatureFeed = Signature.create(zkAppOraclePrivateKey, [
        Field(r10000),
      ]);

      // Send fulfillOracleRequest()
      const txnFeed = await Mina.transaction(player1, () => {
        zkAppOracle.fulfillOracleRequest(
          zkAppClientAddress,
          Field(r10000),
          signatureFeed
        );
      });

      await txnFeed.prove();
      txnFeed.sign([player1Key, zkAppOraclePrivateKey]);
      await txnFeed.send();

      // Test onChain on Client
      const feedData =  zkAppClient.data0.get();
      expect(feedData).toEqual(Field(r10000));

      console.log(`request ${req2.url}
      - offchain-value '${req2.path}' = ${r10000 / 10000}
      - onchain-value '${req2.path}' = ${Number(feedData.toBigInt()) / 10000}`);


    });

  });

});

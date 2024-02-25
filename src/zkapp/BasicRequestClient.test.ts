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

import { IOracleClient, IOracleEvents, OracleContract } from './OracleContract';
import { OracleRequest } from '../gen/oracle-request_pb';
import {
  buildBasicRequestClient,
  buildOracleRequestTx,
} from './BasicRequestClient';

let player1: PublicKey,
  player1Key: PrivateKey,
  player2: PublicKey,
  player2Key: PrivateKey,
  zkAppClientAddress: PublicKey,
  zkAppClientPrivateKey: PrivateKey,
  zkAppOracleAddress: PublicKey,
  zkAppOraclePrivateKey: PrivateKey;

let tokenId: Field;
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

  zkAppOraclePrivateKey = PrivateKey.random();
  zkAppOracleAddress = zkAppOraclePrivateKey.toPublicKey();

  zkAppOracle = new OracleContract(zkAppOracleAddress);

  zkAppClientPrivateKey = PrivateKey.random();
  zkAppClientAddress = zkAppClientPrivateKey.toPublicKey();

  zkAppClient = await buildBasicRequestClient(
    zkAppClientAddress,
    zkAppOracleAddress
  );

  //   zkApp = await buildERC677Contract(zkAppAddress, 'SomeCoin', tokenSymbol, 9);
  //   tokenId = zkApp.token.id;
}

async function setupLocal() {
  let tx1 = await Mina.transaction(player1, () => {
    let feePayerUpdate = AccountUpdate.fundNewAccount(player1);
    feePayerUpdate.send({
      to: zkAppClientAddress,
      amount: Mina.accountCreationFee(),
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
      amount: Mina.accountCreationFee(),
    });
    zkAppOracle.deploy();
  });
  await tx2.prove();
  tx2.sign([zkAppOraclePrivateKey, player1Key]);
  await tx2.send();
}

async function displayEvents(contract: SmartContract) {
  let events = await contract.fetchEvents();
  console.log(
    `events on ${contract.address.toBase58()}`,
    events.map((e) => {
      return { type: e.type, data: JSON.stringify(e.event) };
    })
  );
}

describe('BasicRequestClient SmartContract', () => {
  beforeAll(async () => {
    // await OracleClient.compile();
    await OracleContract.compile();
  });

  describe("Send BasicRequest to 'OracleRequest()'", () => {
    beforeEach(async () => {
      await setupAccounts();
      await setupLocal();
    });

    test('should got oracleRequest event from on-chain tx', async () => {
      // BasicRequest from Client to Oracle 'OracleRequest'
      let req1 = new OracleRequest({
        protocol: 'http',
        method: 'get',
        url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD',
        path: 'RAW.ETH.USD.PRICE',
      });

      const offChainBytes = req1.toBinary();
      const ReqField = Encoding.bytesToFields(offChainBytes);

      let tx = await buildOracleRequestTx(player1, zkAppClient, req1);

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

      // const data = (events[0].event).data
      // console.log(r.sender);
      // console.log(r.req0);

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

      const response = await fetch(req2.url);
      const data = await response.json();
      const result = JSONPath({ path: req2.path, json: data });

      // // Feed data
      // const signatureFeed = Signature.create(zkAppOraclePrivateKey, [
      //   Field(result),
      // ]);

      // const feedData = UInt64.from(result);
      // const signatureFeed = Signature.create(
      //   zkAppOraclePrivateKey,
      //   [Field(1)]
      // );
        
      // const txnFeed = await Mina.transaction(player1, () => {
      //   zkAppOracle.fulfillOracleRequest(
      //     zkAppClientAddress,
      //     feedData.toFields()[0],
      //     signatureFeed
      //   );

      //   // zkAppInstance.feed(
      //   //   roundId,
      //   //   Field(r100),
      //   //   signatureFeed ?? fail('something is wrong with the signature')
      //   // );
      // });
      
      // console.log(JSON.stringify(data));
      // console.log(result);
    });
  });
});

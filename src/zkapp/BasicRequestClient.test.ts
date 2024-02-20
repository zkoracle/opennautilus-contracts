import {
  AccountUpdate,
  Encoding,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  SmartContract,
  UInt32,
} from 'o1js';
import { IOracleClient, OracleContract } from './OracleContract';
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

    test('should got request from on-chain field', async () => {
      let req1 = new OracleRequest({
        protocol: 'http',
        method: 'get',
        url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD',
        path: 'RAW.ETH.USD.PRICE',
      });

      let tx = await buildOracleRequestTx(player1, zkAppClient, req1);

      await tx.prove();
      tx.sign([player1Key, zkAppClientPrivateKey]);
      await tx.send();

      const events = await zkAppOracle.fetchEvents(UInt32.from(0));

      expect(events[0].type).toEqual('OracleRequest'); //

      console.log(events[0].event.data);
    });
  });
});

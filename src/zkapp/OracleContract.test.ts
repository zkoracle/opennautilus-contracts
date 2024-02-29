import {
  AccountUpdate,
  Encoding,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  SmartContract,
} from 'o1js';
// import { OracleClient } from './ClientContract.js';
import { OracleRequest } from '../gen/oracle-request_pb.js';

let player1: PublicKey,
  player1Key: PrivateKey,
  //   player2: PublicKey,
  //   player2Key: PrivateKey,
  zkAppAddress: PublicKey,
  zkAppPrivateKey: PrivateKey;

let tokenId: Field;
// let zkApp: OracleClient; //& OracleClient;

async function setupAccounts() {
  let Local = Mina.LocalBlockchain({
    proofsEnabled: true,
    enforceTransactionLimits: false,
  });
  Mina.setActiveInstance(Local);
  player1Key = Local.testAccounts[0].privateKey;
  player1 = Local.testAccounts[0].publicKey;

  //   player2Key = Local.testAccounts[1].privateKey;
  //   player2 = Local.testAccounts[1].publicKey;

  zkAppPrivateKey = PrivateKey.random();
  zkAppAddress = zkAppPrivateKey.toPublicKey();

  // zkApp = new OracleClient(zkAppAddress);

  //   zkApp = await buildERC677Contract(zkAppAddress, 'SomeCoin', tokenSymbol, 9);
  //   tokenId = zkApp.token.id;
}

async function setupLocal() {
  // let tx = await Mina.transaction(player1, () => {
  //   let feePayerUpdate = AccountUpdate.fundNewAccount(player1);
  //   feePayerUpdate.send({
  //     to: zkAppAddress,
  //     amount: Mina.accountCreationFee(),
  //   });
  //   zkApp.deploy();
  // });
  // await tx.prove();
  // tx.sign([zkAppPrivateKey, player1Key]);
  // await tx.send();
}

describe('OracleContract', () => {
  beforeAll(async () => {
    // await OracleClient.compile();
  });

  describe(' Requst processing ', () => {
    beforeEach(async () => {
      await setupAccounts();
      await setupLocal();
    });

    test('should got request from on-chain field', async () => {
      // Callback
    });
  });
});

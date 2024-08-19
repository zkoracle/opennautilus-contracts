import {
  UInt64,
  Mina,
  PrivateKey,
  AccountUpdate,
  PublicKey,
  Field,
  Experimental,
  TokenId,
  SmartContract,
  method,
  CircuitString,
  fetchAccount,
  Signature,
  TokenContract,
} from 'o1js';
import { buildOC20Contract, IOC20, Oc20State } from './Oc20Token.js';
import { TestPublicKey } from 'o1js/dist/node/lib/mina/local-blockchain';
import assert from 'assert';

const tokenSymbol = 'SOM';
const tokenName = 'SomeCoin';

const proofsEnabled = true;
let zkPubkey: PublicKey;
let sendPubkey: TestPublicKey;
let recvPubkey: TestPublicKey;
let zkApp: SmartContract & IOC20;

async function setupLocalTest() {
  const Local = await Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);

  let [sender, receiver, contractAccount, other] = Local.testAccounts;
  zkPubkey = contractAccount;
  [zkApp] = await buildOC20Contract(contractAccount, tokenName, tokenSymbol, 9);
  sendPubkey = sender;
  recvPubkey = receiver;
  // deploy and create first account

  // console.time('deploy');
  await Mina.transaction(sender, async () => {
    await zkApp.deploy();
  })
    .sign([sender.key, contractAccount.key])
    .prove()
    .send();
  // console.timeEnd('deploy');
}

describe('Setup OC20 Contract', () => {
  beforeAll(async () => {
    await setupLocalTest();
  });

  describe('Signature Authorization', () => {
    /*
      test case description:
      Check token contract can be deployed and initialized
      tested cases:
        - create a new token
        - deploy a zkApp under a custom token
        - create a new valid token with a different parentTokenId
        - set the token symbol after deployment
    */

    describe('Oc20 Contract Creation/Deployment', () => {
      test('setting a valid token symbol on a contract', async () => {
        expect(zkApp).toBeDefined();
        let symbol = zkApp.symbol().toString();
        expect(tokenSymbol).toBeDefined();
        expect(symbol).toEqual(tokenSymbol);
      });

      test('setting a valid token name on a contract', async () => {
        expect(zkApp).toBeDefined();
        let name = zkApp.name().toString();
        expect(tokenName).toBeDefined();
        expect(name).toEqual(tokenName);
      });
    });
  });

  describe('Create Account', () => {
    test('token contract can successfully mint with sign and updates the balances in the ledger (signature)', async () => {
      await Mina.transaction(sendPubkey, async () => {
        // first call (should succeed)
        await zkApp.createAccount(sendPubkey, UInt64.from(1000));

        // second call (should fail)
        await zkApp.createAccount(sendPubkey, UInt64.from(2000));
      })
        .sign([sendPubkey.key])
        .prove()
        .send();

      let proof = await Oc20State.createSettlementProof();

      console.time('settle 1');
      await Mina.transaction(sendPubkey, () => zkApp.settle(proof))
        .sign([sendPubkey.key])
        .prove()
        .send();
      console.timeEnd('settle 1');

      let supply = (await zkApp.totalSupply()).toBigInt();
      assert.strictEqual(supply, 1000n);
    });
  });

  describe('Transfer Oc20', () => {
    test('token contract can successfully send with sign and updates the balances in the ledger', async () => {
      console.time('transfer');
      await Mina.transaction(sendPubkey, async () => {
        await zkApp.transfer(sendPubkey, recvPubkey, UInt64.from(100));
      })
        .sign([sendPubkey.key])
        .prove()
        .send();
      console.timeEnd('transfer');

      await Mina.transaction(sendPubkey, async () => {
        // more transfers that should fail
        // (these are enough to need two proof steps during settlement)
        await zkApp.transfer(sendPubkey, recvPubkey, UInt64.from(200));
        await zkApp.transfer(sendPubkey, recvPubkey, UInt64.from(300));
        await zkApp.transfer(sendPubkey, recvPubkey, UInt64.from(400));

        // // create another account (should succeed)
        // await zkApp.createAccount(other, UInt64.from(555));

        // create existing account again (should fail)
        await zkApp.createAccount(recvPubkey, UInt64.from(333));
      })
        .sign([sendPubkey.key])
        .prove()
        .send();
      console.timeEnd('more transfers');

      console.time('settlement proof 2');
      let proof = await Oc20State.createSettlementProof();
      console.timeEnd('settlement proof 2');

      console.time('settle 2');
      await Mina.transaction(sendPubkey, () => zkApp.settle(proof))
        .sign([sendPubkey.key])
        .prove()
        .send();
      console.timeEnd('settle 2');

      //
      // let supply = (await zkApp.getSupply()).toBigInt();
      // assert.strictEqual(supply, expectedSupply);
    });
  });
});

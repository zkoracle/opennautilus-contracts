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
import { buildOC20Contract, IOC20 } from './Oc20Token.js';

const tokenSymbol = 'SOM';
const tokenName = 'SomeCoin';

const proofsEnabled = true;
let zkPubkey: PublicKey;
let zkApp: SmartContract & IOC20;

async function setupLocalTest() {
  const Local = await Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);

  let [sender, receiver, contractAccount, other] = Local.testAccounts;
  zkPubkey = contractAccount;
  zkApp = await buildOC20Contract(contractAccount, tokenName, tokenSymbol, 9);

  // deploy and create first account

  console.time('deploy');
  await Mina.transaction(sender, async () => {
    await zkApp.deploy();
  })
    .sign([sender.key, contractAccount.key])
    .prove()
    .send();
  console.timeEnd('deploy');
}

describe('Setup OC20 Contract', () => {

  beforeEach(async () => {
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

})

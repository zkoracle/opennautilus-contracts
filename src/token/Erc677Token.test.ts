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
} from 'o1js';
import { IERC677, buildERC677Contract } from './Erc677Token';

const tokenSymbol = 'SOM';

let player1: PublicKey,
  player1Key: PrivateKey,
  //   player2: PublicKey,
  //   player2Key: PrivateKey,
  zkAppAddress: PublicKey,
  zkAppPrivateKey: PrivateKey;

let tokenId: Field;
let zkApp: SmartContract & IERC677;

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

  zkApp = await buildERC677Contract(zkAppAddress, 'SomeCoin', tokenSymbol, 9);
  tokenId = zkApp.token.id;
}

async function setupLocal() {
  let tx = await Mina.transaction(player1, () => {
    let feePayerUpdate = AccountUpdate.fundNewAccount(player1);
    feePayerUpdate.send({
      to: zkAppAddress,
      amount: Mina.accountCreationFee(),
    });
    zkApp.deploy();
  });
  await tx.prove();
  tx.sign([zkAppPrivateKey, player1Key]);
  await tx.send();
}

describe('Erc677 TokenContract', () => {
  beforeAll(async () => {
    //
  });

  describe('Token Contract Creation/Deployment', () => {
    beforeEach(async () => {
      await setupAccounts();
      await setupLocal();
    });

    test('correct token id can be derived with an existing token owner', () => {
      expect(tokenId).toEqual(TokenId.derive(zkAppAddress));
    });

    it.todo('deployed token contract exists in the ledger');
    // test('deployed token contract exists in the ledger', async () => {
    //   // getAccount: Could not find account for public key {} with the tokenId {}
    //   //   await fetchAccount({publicKey: zkAppAddress});
    //   //   expect(Mina.getAccount(zkAppAddress, tokenId)).toBeDefined();
    // });

    test('setting a valid token symbol on a token contract', async () => {
      const symbol = Mina.getAccount(zkAppAddress).tokenSymbol;
      expect(tokenSymbol).toBeDefined();
      expect(symbol).toEqual(tokenSymbol);
    });

    it.todo('building a valid token name on a token contract');
    // test('building a valid token name on a token contract', async () => {
    //   // expect("Some").toEqual(zkApp.name?);
    // });
  });
});

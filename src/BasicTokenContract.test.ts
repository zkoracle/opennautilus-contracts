import { AccountUpdate, Field, Mina, PrivateKey, PublicKey, SmartContract, TokenId } from 'o1js';
import { buildBasicTokenContract } from './BasicTokenContract.js';

const tokenSymbol = "MYS";

let 
    player1: PublicKey,
  player1Key: PrivateKey,
//   player2: PublicKey,
//   player2Key: PrivateKey,
  zkAppAddress: PublicKey,
  zkAppPrivateKey: PrivateKey;

let tokenId: Field;
let zkApp: SmartContract;

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

  zkApp = await buildBasicTokenContract(zkAppAddress, tokenSymbol);  
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

describe('BasicTokenContract', () => {
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

    test('setting a valid token symbol on a token contract', async () => {
        const symbol = Mina.getAccount(zkAppAddress).tokenSymbol;
        expect(tokenSymbol).toBeDefined();
        expect(symbol).toEqual(tokenSymbol);
    });
  });
  
});
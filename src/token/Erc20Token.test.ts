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
import { IERC20, buildERC20Contract, IERC20META, buildERC20MetaContract } from './Erc20Token.js';

const tokenSymbol = 'SOM';

let player1: PublicKey,
  player1Key: PrivateKey,
  //   player2: PublicKey,
  //   player2Key: PrivateKey,
  zkAppAddress: PublicKey,
  zkAppPrivateKey: PrivateKey,
  zkAppMetaAddress: PublicKey,
  zkAppMetaPrivateKey: PrivateKey;

let tokenId: Field;
let zkApp: SmartContract & IERC20 & IERC20META;
let zkAppMeta: SmartContract & IERC20META;

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

  zkAppMetaPrivateKey = PrivateKey.random();
  zkAppMetaAddress = zkAppMetaPrivateKey.toPublicKey();

  zkApp = await buildERC20Contract(zkAppAddress, 'SomeCoin', tokenSymbol, 9);
  tokenId = zkApp.token.id;

  zkAppMeta = await buildERC20MetaContract(zkAppMetaAddress, 'SomeCoin', tokenSymbol, 9);

}

async function setupLocal() {
  let tx1 = await Mina.transaction(player1, () => {
    let feePayerUpdate = AccountUpdate.fundNewAccount(player1);
    feePayerUpdate.send({
      to: zkAppAddress,
      amount: Mina.accountCreationFee(),
    });
    zkApp.deploy();
  });
  await tx1.prove();
  tx1.sign([zkAppPrivateKey, player1Key]);
  await tx1.send();

  let tx2 = await Mina.transaction(player1, () => {
    let feePayerUpdate = AccountUpdate.fundNewAccount(player1);
    feePayerUpdate.send({
      to: zkAppMetaAddress,
      amount: Mina.accountCreationFee(),
    });
    zkAppMeta.deploy();
  });
  await tx2.prove();
  tx2.sign([zkAppMetaPrivateKey, player1Key]);
  await tx2.send();

}

describe('Erc20 TokenContract', () => {
  beforeEach(async () => {
    await setupAccounts();
    await setupLocal();
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

    describe('Erc20 Contract Creation/Deployment', () => {
      test('correct token id can be derived with an existing token owner', () => {
        expect(tokenId).toEqual(TokenId.derive(zkAppAddress));
      });

      // it.todo('deployed token contract exists in the ledger');

      test('setting a valid token symbol on a token contract', async () => {
        const symbol = Mina.getAccount(zkAppAddress).tokenSymbol;
        expect(tokenSymbol).toBeDefined();
        expect(symbol).toEqual(tokenSymbol);

      });

      // it.todo('building a valid token name on a token contract');
    });
  });
});


describe('Erc20Meta TokenContract', () => {
  beforeEach(async () => {
    await setupAccounts();
    await setupLocal();
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

    describe('Erc20 Meta Contract Creation/Deployment', () => {
      test('correct token id can be derived with an existing token owner', () => {
        expect(tokenId).toEqual(TokenId.derive(zkAppMetaAddress));
      });

      // it.todo('deployed token contract exists in the ledger');

      test('setting a valid token symbol on a token contract', async () => {
        const symbol = Mina.getAccount(zkAppMetaAddress).tokenSymbol;
        expect(tokenSymbol).toBeDefined();
        expect(symbol).toEqual(tokenSymbol);

      });

      // it.todo('building a valid token name on a token contract');
    });
  });
});


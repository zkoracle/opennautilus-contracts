import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  Signature,
  SmartContract,
  TokenId,
  UInt64,
  fetchAccount,
  TokenContract,
} from 'o1js';
import {
  IBasicTokenContract,
  buildBasicTokenContract,
} from './BasicTokenContract.js';

const tokenSymbol = 'MYS';

let player1: PublicKey,
  player1Key: PrivateKey,
  player2: PublicKey,
  player2Key: PrivateKey,
  zkAppAddress: PublicKey,
  zkAppPrivateKey: PrivateKey;

let tokenId: Field;
let zkApp: TokenContract & IBasicTokenContract;

async function setupAccounts() {
  let Local = await Mina.LocalBlockchain({
    proofsEnabled: true,
    enforceTransactionLimits: false,
  });
  Mina.setActiveInstance(Local);
  player1Key = Local.testAccounts[0].key;
  player1 = Local.testAccounts[0];

  player2Key = Local.testAccounts[1].key;
  player2 = Local.testAccounts[1];

  zkAppPrivateKey = PrivateKey.random();
  zkAppAddress = zkAppPrivateKey.toPublicKey();

  zkApp = await buildBasicTokenContract(zkAppAddress, tokenSymbol);
  tokenId = TokenId.derive(zkAppAddress);
}

async function setupLocal() {
  let tx = await Mina.transaction(player1, async () => {
    await zkApp.deploy();
    AccountUpdate.fundNewAccount(player1).send({
      to: zkApp.self,
      amount: 10_000_000,
    });
  });
  await tx.prove();
  tx.sign([zkAppPrivateKey, player1Key]);
  await tx.send();
}

describe('BasicTokenContract', () => {
  beforeEach(async () => {
    await setupAccounts();
    await setupLocal();
  });

  describe('Signature Authorization (Account)', () => {
    /*
      test case description:
      Check token contract can be deployed and initialized
      tested cases:
        - create a new token
        - deploy a zkApp under a custom token
        - create a new valid token with a different parentTokenId
        - set the token symbol after deployment
    */

    describe('Token Contract Creation/Deployment', () => {
      test('correct token id can be derived with an existing token owner', () => {
        expect(tokenId).toEqual(TokenId.derive(zkAppAddress));
      });

      // it.todo('deployed token contract exists in the ledger');

      test('setting a valid token symbol on a token contract', async () => {
        const symbol = Mina.getAccount(zkAppAddress).tokenSymbol;
        expect(tokenSymbol).toBeDefined();
        expect(symbol).toEqual(tokenSymbol);
      });
    });

    /*
      test case description:
      token contract can mint new tokens with a signature
      tested cases:
        - mints and updates the token balance of the receiver
        - (for creating supply) fails if we mint over an overflow amount
    */
    describe('Mint token', () => {
      test('token contract can successfully mint with sign and updates the balances in the ledger (signature)', async () => {
        const amount = UInt64.from(100_000);
        const adminSignature = Signature.create(
          zkAppPrivateKey,
          amount.toFields().concat(player1.toFields())
        );

        let tx = await Mina.transaction(player1, async () => {
          AccountUpdate.fundNewAccount(player1);
          await zkApp.mintWithSignature(player1, amount, adminSignature);
        });

        await tx.prove();
        tx.sign([player1Key, zkAppPrivateKey]);
        await tx.send();

        expect(Mina.getBalance(player1, tokenId).value.toBigInt()).toEqual(
          100_000n
        );
      });

      // it.todo('minting should fail if overflow occurs');
    });

    /*
      test case description:
      token contract can burn tokens with a signature
      tested cases:
        - burns and updates the token balance of the receiver
        - (for creating supply) fails if we burn more than the balance amount
    */
    describe('Burn token', () => {
      test('token contract can successfully burn with sign and updates the balances in the ledger (signature)', async () => {
        const amountMint = UInt64.from(100_000);
        const adminSigMint = Signature.create(
          zkAppPrivateKey,
          amountMint.toFields().concat(player1.toFields())
        );

        let txMint = await Mina.transaction(player1, async () => {
          AccountUpdate.fundNewAccount(player1);
          await zkApp.mintWithSignature(player1, amountMint, adminSigMint);
        });

        await txMint.prove();
        txMint.sign([player1Key, zkAppPrivateKey]);
        await txMint.send();

        const amountBurn = UInt64.from(10_000);
        const adminSigBurn = Signature.create(
          zkAppPrivateKey,
          amountBurn.toFields().concat(player1.toFields())
        );

        let txBurn = await Mina.transaction(player1, async () => {
          await zkApp.burnWithSignature(player1, amountBurn, adminSigBurn);
        });

        await txBurn.prove();
        txBurn.sign([player1Key, zkAppPrivateKey]);
        await txBurn.send();

        expect(Mina.getBalance(player1, tokenId).value.toBigInt()).toEqual(
          90_000n
        );
      });

      // it.todo('throw error if token owner burns more tokens than token account has');
    });

    // describe('Transfer', () => {

    // });
  });
});

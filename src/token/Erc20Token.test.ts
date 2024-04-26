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
import { IERC20, buildERC20Contract, SErc20Contract } from './Erc20Token.js';

const tokenSymbol = 'SOM';

let player1: PublicKey,
  player1Key: PrivateKey,
  player2: PublicKey,
  player2Key: PrivateKey,
  zkAppAddress: PublicKey,
  zkAppPrivateKey: PrivateKey,
  zkAppStaticAddress: PublicKey,
  zkAppStaticPrivateKey: PrivateKey;

let tokenId: Field;
let zkApp: TokenContract & IERC20;
let zkAppStaticMeta: SErc20Contract;

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

  zkAppStaticPrivateKey = PrivateKey.random();
  zkAppStaticAddress = zkAppStaticPrivateKey.toPublicKey();

  zkApp = await buildERC20Contract(zkAppAddress, 'SomeCoin', tokenSymbol, 9);
  tokenId = TokenId.derive(zkAppAddress);

  SErc20Contract.staticName = 'SomeCoin';
  SErc20Contract.staticSymbol = tokenSymbol;
  SErc20Contract.staticDecimals = 9;

  zkAppStaticMeta = new SErc20Contract(zkAppStaticAddress);

  await SErc20Contract.compile();
}

async function setupLocal() {
  let tx1 = await Mina.transaction(player1, async () => {
    await zkApp.deploy();
    AccountUpdate.fundNewAccount(player1).send({
      to: zkApp.self,
      amount: 10_000_000,
    });
  });
  await tx1.prove();
  tx1.sign([zkAppPrivateKey, player1Key]);
  await tx1.send();

  let tx3 = await Mina.transaction(player1, async () => {
    await zkAppStaticMeta.deploy();
    AccountUpdate.fundNewAccount(player1).send({
      to: zkAppStaticMeta.self,
      amount: 10_000_000,
    });
  });
  await tx3.prove();
  tx3.sign([zkAppStaticPrivateKey, player1Key]);
  await tx3.send();
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

  describe('Mint token', () => {
    test('token contract can successfully mint with sign and updates the balances in the ledger (signature)', async () => {
      const amount = UInt64.from(100_000);

      let tx = await Mina.transaction(player1, async () => {
        AccountUpdate.fundNewAccount(player1);
        await zkApp.mint(player1, amount);
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

  describe('Burn token', () => {
    test('token contract can successfully burn with sign and updates the balances in the ledger', async () => {
      // await fetchAccount({ publicKey: player1 })

      expect(UInt64.zero).toEqual(await zkApp.balanceOf(player1));

      // Mint
      const txnMint = await Mina.transaction(player1, async () => {
        AccountUpdate.fundNewAccount(player1);
        zkApp.mint(player1, UInt64.from(500_000));
      });

      await txnMint.prove();
      txnMint.sign([player1Key, zkAppPrivateKey]);
      await txnMint.send();

      expect(UInt64.from(500_000)).toEqual(await zkApp.balanceOf(player1));

      // Burn
      const txnBurn = await Mina.transaction(player1, async () => {
        zkApp.burn(player1, UInt64.from(50_000));
      });

      await txnBurn.prove();
      txnBurn.sign([player1Key, zkAppPrivateKey]);
      await txnBurn.send();

      expect(UInt64.from(450_000)).toEqual(await zkApp.balanceOf(player1));
    });
  });

  describe('Send token', () => {
    test('token contract can successfully send with sign and updates the balances in the ledger', async () => {
      // await fetchAccount({ publicKey: player1 })

      expect(UInt64.zero).toEqual(await zkApp.balanceOf(player1));

      // Mint
      const txnMint = await Mina.transaction(player1, async () => {
        AccountUpdate.fundNewAccount(player1);
        zkApp.mint(player1, UInt64.from(500_000));
      });

      await txnMint.prove();
      txnMint.sign([player1Key, zkAppPrivateKey]);
      await txnMint.send();

      expect(UInt64.from(500_000)).toEqual(await zkApp.balanceOf(player1));

      const txnSend = await Mina.transaction(player2, async () => {
        AccountUpdate.fundNewAccount(player2);
        zkApp.mint(player2, UInt64.from(400_000));
      });

      await txnSend.prove();
      txnSend.sign([player2Key, zkAppPrivateKey]);
      await txnSend.send();

      expect(UInt64.from(400_000)).toEqual(await zkApp.balanceOf(player2));

      const txnSend2 = await Mina.transaction(player2, async () => {
        // AccountUpdate.fundNewAccount(player2);
        await zkApp.transferFrom(player2, player1, UInt64.from(40_000));
      });

      await txnSend2.prove();
      txnSend2.sign([player2Key, zkAppPrivateKey]);
      await txnSend2.send();

      expect(UInt64.from(540_000)).toEqual(await zkApp.balanceOf(player1));
      expect(UInt64.from(360_000)).toEqual(await zkApp.balanceOf(player2));
    });
  });
});

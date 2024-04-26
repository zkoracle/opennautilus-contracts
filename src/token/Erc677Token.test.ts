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
  TokenContract,
} from 'o1js';
import {
  IERC677,
  buildERC677Contract,
  SErc677Contract,
} from './Erc677Token.js';

const tokenSymbol = 'SOM';

let player1: PublicKey,
  player1Key: PrivateKey,
  player2: PublicKey,
  player2Key: PrivateKey,
  zkAppAddress: PublicKey,
  zkAppPrivateKey: PrivateKey,
  serc677TokenAddress: PublicKey,
  serc677TokenPrivateKey: PrivateKey;

let tokenId: Field;
let tokenSErc677Id: Field;
let zkApp: TokenContract & IERC677;
let zkAppSErc677: SErc677Contract;

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

  zkApp = await buildERC677Contract(zkAppAddress, 'SomeCoin', tokenSymbol, 9);
  tokenId = TokenId.derive(zkAppAddress);

  serc677TokenPrivateKey = PrivateKey.random();
  serc677TokenAddress = serc677TokenPrivateKey.toPublicKey();

  zkAppSErc677 = new SErc677Contract(serc677TokenAddress);
  tokenSErc677Id = TokenId.derive(serc677TokenAddress);
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

  let tx3 = await Mina.transaction(player1, async () => {
    await zkAppSErc677.deploy();
    AccountUpdate.fundNewAccount(player1).send({
      to: zkAppSErc677.self,
      amount: 10_000_000,
    });
  });
  await tx3.prove();
  tx3.sign([serc677TokenPrivateKey, player1Key]);
  await tx3.send();
}

describe('Erc677 TokenContract', () => {
  beforeAll(async () => {
    // console.log("beforeAll --- ")
    SErc677Contract.staticSymbol = 'PRC';
    SErc677Contract.staticName = 'PRICE';
    SErc677Contract.staticDecimals = 9;

    await SErc677Contract.compile();
  });

  beforeEach(async () => {
    await setupAccounts();
    await setupLocal();
  });

  describe('Signature Authorization', () => {
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

    describe('Mint token', () => {
      test('token contract can successfully mint with sign and updates the balances in the ledger', async () => {
        // await fetchAccount({ publicKey: player1 })

        expect(UInt64.zero).toEqual(await zkAppSErc677.balanceOf(player1));

        // Mint
        const txnMint = await Mina.transaction(player1, async () => {
          AccountUpdate.fundNewAccount(player1);
          await zkAppSErc677.mint(player1, UInt64.from(500_000));
        });

        await txnMint.prove();
        txnMint.sign([player1Key, serc677TokenPrivateKey]);
        await txnMint.send();

        expect(UInt64.from(500_000)).toEqual(
          await zkAppSErc677.balanceOf(player1)
        );
      });
    });

    describe('Burn token', () => {
      test('token contract can successfully burn with sign and updates the balances in the ledger', async () => {
        // await fetchAccount({ publicKey: player1 })

        expect(UInt64.zero).toEqual(await zkAppSErc677.balanceOf(player1));

        // Mint
        const txnMint = await Mina.transaction(player1, async () => {
          AccountUpdate.fundNewAccount(player1);
          await zkAppSErc677.mint(player1, UInt64.from(500_000));
        });

        await txnMint.prove();
        txnMint.sign([player1Key, serc677TokenPrivateKey]);
        await txnMint.send();

        expect(UInt64.from(500_000)).toEqual(
          await zkAppSErc677.balanceOf(player1)
        );

        // Burn
        const txnBurn = await Mina.transaction(player1, async () => {
          await zkAppSErc677.burn(player1, UInt64.from(50_000));
        });

        await txnBurn.prove();
        txnBurn.sign([player1Key, serc677TokenPrivateKey]);
        await txnBurn.send();

        expect(UInt64.from(450_000)).toEqual(
          await zkAppSErc677.balanceOf(player1)
        );
      });
    });

    describe('Send token', () => {
      test('token contract can successfully mint with sign and updates the balances in the ledger', async () => {
        // await fetchAccount({ publicKey: player1 })

        expect(UInt64.zero).toEqual(await zkAppSErc677.balanceOf(player1));

        // Mint
        const txnMint = await Mina.transaction(player1, async () => {
          AccountUpdate.fundNewAccount(player1);
          await zkAppSErc677.mint(player1, UInt64.from(500_000));
        });

        await txnMint.prove();
        txnMint.sign([player1Key, serc677TokenPrivateKey]);
        await txnMint.send();

        expect(UInt64.from(500_000)).toEqual(
          await zkAppSErc677.balanceOf(player1)
        );

        const txnSend = await Mina.transaction(player2, async () => {
          AccountUpdate.fundNewAccount(player2);
          await zkAppSErc677.mint(player2, UInt64.from(400_000));
        });

        await txnSend.prove();
        txnSend.sign([player2Key, serc677TokenPrivateKey]);
        await txnSend.send();

        expect(UInt64.from(400_000)).toEqual(
          await zkAppSErc677.balanceOf(player2)
        );

        const txnSend2 = await Mina.transaction(player2, async () => {
          // AccountUpdate.fundNewAccount(player2);
          await zkAppSErc677.transferFrom(
            player2,
            player1,
            UInt64.from(40_000)
          );
        });

        await txnSend2.prove();
        txnSend2.sign([player2Key, serc677TokenPrivateKey]);
        await txnSend2.send();

        expect(UInt64.from(540_000)).toEqual(
          await zkAppSErc677.balanceOf(player1)
        );
        expect(UInt64.from(360_000)).toEqual(
          await zkAppSErc677.balanceOf(player2)
        );
      });
    });
  });
});

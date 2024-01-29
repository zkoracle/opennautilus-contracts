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
let zkApp: SmartContract & IBasicTokenContract;

async function setupAccounts() {
  let Local = Mina.LocalBlockchain({
    proofsEnabled: true,
    enforceTransactionLimits: false,
  });
  Mina.setActiveInstance(Local);
  player1Key = Local.testAccounts[0].privateKey;
  player1 = Local.testAccounts[0].publicKey;

  player2Key = Local.testAccounts[1].privateKey;
  player2 = Local.testAccounts[1].publicKey;

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
    });

    /*
      test case description:
      token contract can mint new tokens with a signature
      tested cases:
        - mints and updates the token balance of the receiver
        - (for creating supply) fails if we mint over an overflow amount
    */
    describe('Mint token', () => {
      beforeEach(async () => {
        await setupAccounts();
        await setupLocal();
      });

      test('token contract can successfully mint with sign and updates the balances in the ledger (signature)', async () => {
        const amount = UInt64.from(100_000);
        const adminSignature = Signature.create(
          zkAppPrivateKey,
          amount.toFields().concat(player1.toFields())
        );

        let tx = await Mina.transaction(player1, () => {
          AccountUpdate.fundNewAccount(player1);
          zkApp.mintWithSignature(player1, amount, adminSignature);
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
      beforeEach(async () => {
        await setupAccounts();
        await setupLocal();
      });
      test('token contract can successfully burn with sign and updates the balances in the ledger (signature)', async () => {
        const amountMint = UInt64.from(100_000);
        const adminSigMint = Signature.create(
          zkAppPrivateKey,
          amountMint.toFields().concat(player1.toFields())
        );

        let txMint = await Mina.transaction(player1, () => {
          AccountUpdate.fundNewAccount(player1);
          zkApp.mintWithSignature(player1, amountMint, adminSigMint);
        });

        await txMint.prove();
        txMint.sign([player1Key, zkAppPrivateKey]);
        await txMint.send();

        const amountBurn = UInt64.from(10_000);
        const adminSigBurn = Signature.create(
          zkAppPrivateKey,
          amountBurn.toFields().concat(player1.toFields())
        );

        let txBurn = await Mina.transaction(player1, () => {
          zkApp.burnWithSignature(player1, amountBurn, adminSigBurn);
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

    describe('Transfer', () => {
      beforeEach(async () => {
        await setupAccounts();
        await setupLocal();
        // await setupLocalPlayer2();
      });

      it.todo('change the balance of a token account after sending');
      // test('change the balance of a token account after sending', async () => {
      //   const amountMint = UInt64.from(100_000)
      //   const adminSigMint = Signature.create(zkAppPrivateKey,
      //     amountMint.toFields().concat(player1.toFields()));

      //   let txMint = await Mina.transaction( player1 , () => {
      //       AccountUpdate.fundNewAccount(player1);
      //       zkApp.mint(player1, amountMint, adminSigMint);
      //       zkApp.sendTokens(
      //         player1,
      //         player2,
      //         UInt64.from(10_000)
      //       );
      //   })

      //   await txMint.prove();
      //   txMint.sign([player1Key, zkAppPrivateKey]);
      //   await txMint.send();

      //   // let txSend = await Mina.transaction(player1, () => {
      //   //   AccountUpdate.fundNewAccount(player1);
      //   //   zkApp.sendTokens(
      //   //     player1,
      //   //     player2,
      //   //     UInt64.from(10_000)
      //   //   );
      //   // });
      //   // await txSend.prove();
      //   // txSend.sign([player1Key, zkAppPrivateKey]);
      //   // await txSend.send();

      //   expect(
      //     Mina.getBalance(player1, tokenId).value.toBigInt()
      //   ).toEqual(90_000n);
      //   expect(
      //     Mina.getBalance(player2, tokenId).value.toBigInt()
      //   ).toEqual(10_000n);
      // });

      it.todo(
        'should error creating a token account if no account creation fee is specified'
      );
      // test('should error creating a token account if no account creation fee is specified', async () => {
      //   await (
      //     await Mina.transaction(feePayer, () => {
      //       AccountUpdate.fundNewAccount(feePayer);
      //       tokenZkapp.mint(zkAppBAddress, UInt64.from(100_000));
      //       tokenZkapp.requireSignature();
      //     })
      //   )
      //     .sign([feePayerKey, tokenZkappKey])
      //     .send();
      //   let tx = (
      //     await Mina.transaction(feePayer, () => {
      //       tokenZkapp.token.send({
      //         from: zkAppBAddress,
      //         to: zkAppCAddress,
      //         amount: UInt64.from(10_000),
      //       });
      //       AccountUpdate.attachToTransaction(tokenZkapp.self);
      //       tokenZkapp.requireSignature();
      //     })
      //   ).sign([zkAppBKey, feePayerKey, tokenZkappKey]);

      //   await expect(tx.send()).rejects.toThrow();
      // });

      it.todo('should error if sender sends more tokens than they have');
      // test('should error if sender sends more tokens than they have', async () => {
      //   await (
      //     await Mina.transaction(feePayer, () => {
      //       AccountUpdate.fundNewAccount(feePayer);
      //       tokenZkapp.mint(zkAppBAddress, UInt64.from(100_000));
      //       tokenZkapp.requireSignature();
      //     })
      //   )
      //     .sign([feePayerKey, tokenZkappKey])
      //     .send();
      //   let tx = (
      //     await Mina.transaction(feePayer, () => {
      //       tokenZkapp.token.send({
      //         from: zkAppBAddress,
      //         to: zkAppCAddress,
      //         amount: UInt64.from(100_000),
      //       });
      //       AccountUpdate.attachToTransaction(tokenZkapp.self);
      //       tokenZkapp.requireSignature();
      //     })
      //   ).sign([zkAppBKey, feePayerKey, tokenZkappKey]);
      //   await expect(tx.send()).rejects.toThrow();
      // });
    });
  });
});

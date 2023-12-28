// import fs from 'fs/promises';
import { AccountUpdate, Lightnet, Mina, PrivateKey, SmartContract, fetchAccount } from 'o1js';


export class Toolkit {
    Toolkit(){ }

    public static async getTxnUrl(
        graphQlUrl: string, txnHash: string | undefined) 
    {
        console.log(graphQlUrl);
    
        const txnBroadcastServiceName = new URL(graphQlUrl).hostname
          .split('.')
          .filter((item) => item === 'minascan' || item === 'minaexplorer')?.[0];
        const networkName = new URL(graphQlUrl).hostname
          .split('.')
          .filter((item) => item === 'berkeley' || item === 'testworld')?.[0];
        if (txnBroadcastServiceName && networkName) {
          return `https://minascan.io/${networkName}/tx/${txnHash}?type=zk-tx`;
        }
        return `Transaction hash: ${txnHash}`;
    }
    
    public static async processTx(
        config:any, sentTx: Mina.Transaction, keys: PrivateKey[], tag: string) {

        console.log('Build transaction and create proof...');
        await sentTx.prove();
      
        /**
         * note: this tx needs to be signed with `tx.sign()`, because `deploy` uses `requireSignature()` under the hood,
         * so one of the account updates in this tx has to be authorized with a signature (vs proof).
         * this is necessary for the deploy tx because the initial permissions for all account fields are "signature".
         * (but `deploy()` changes some of those permissions to "proof" and adds the verification key that enables proofs.
         * that's why we don't need `tx.sign()` for the later transactions.)
         */
        console.log('Sending the transaction.');
        let pendingTx = await sentTx.sign(keys).send();
      
        if (pendingTx.hash() !== undefined) {
            console.log(`Success! Update transaction sent.
          Your smart contract state will be updated
          as soon as the transaction is included in a block.
          Txn hash: ${pendingTx.hash()}
          `);
        }
      
        console.log('Waiting for transaction inclusion in a block.');
        await pendingTx.wait({ maxAttempts: 90 });
                
        if (pendingTx?.hash() !== undefined) {
            console.log(`Success! ${tag} transaction sent.
          Your smart contract state will be updated
          as soon as the transaction is included in a block:
          ${this.getTxnUrl(config.network.mina, pendingTx.hash())}
          `);
      
        }
    
    }

    public static async isFileExists(fs: any, f: string) {
        try {
          await fs.stat(f);
          return true;
        } catch {
          return false;
        }
    }
      
    public static async initialFeePayer(
        fs: any, network: string) {

        let feePayerBase58;
      
        if(network !== "lightnet") 
        {
          feePayerBase58 = await this.initialKey(fs, 'keys/tictactoe-feePayer.key', "feePayerPrivateKey");
          const feePayerPrivateKey = PrivateKey.fromBase58(feePayerBase58.privateKey);
          const feePayerAccount = feePayerPrivateKey.toPublicKey();
      
          console.log(`Load feePayerPrivateKey ... `);
      
          await fetchAccount({publicKey: feePayerAccount});
      
          console.log(`feePayer '${feePayerBase58.publicKey}' = ${Mina.getAccount(feePayerAccount).balance}`);
      
        } 
        else
        {
          feePayerBase58 = await this.initialKeyPairFromLightnet(fs, 'keys/tictactoe-acquireFeePayer.key');
      
        }
      
        return feePayerBase58;
      
    }
      
    public static async initialPlayers(
        fs: any, network: string) {

        let player1PrivateKey;
        let player2PrivateKey;
      
        if(network !== "lightnet") 
        {
          const player1Keys = await this.initialKey(fs, 'keys/tictactoe-player1.key', "player1PrivateKey");
          player1PrivateKey = PrivateKey.fromBase58(player1Keys.privateKey);
          console.log(`Load player1PrivateKey ... `);
          const player2Keys = await this.initialKey(fs, 'keys/tictactoe-player2.key', "playerPrivateKey");
          player2PrivateKey = PrivateKey.fromBase58(player2Keys.privateKey);
          console.log(`Load player2PrivateKey ... `);
      
        } else 
        {
          // Player setup
          player1PrivateKey = (await Lightnet.acquireKeyPair()).privateKey
          console.log('Acquire player1PrivateKey ...');
      
          player2PrivateKey = (await Lightnet.acquireKeyPair()).privateKey
          console.log('Acquire player2PrivateKey ...');
        }
      
        return {
          pk1: player1PrivateKey,
          pk2: player2PrivateKey
        }
      
    }
      
    public static async storePrivateKey(
        fs: any, path:string, key: PrivateKey) {

        await fs.writeFile(path, JSON.stringify({
          privateKey: key.toBase58(),
          publicKey: key.toPublicKey()
        }, null, 2))
    }
      
    public static async initialKeyPairFromLightnet(fs: any, path:string)
    {
        // await fs.mkdir("keys");
        if (!(await this.isFileExists(fs, path))) {
          
          const feePayerPrivateKey = (await Lightnet.acquireKeyPair()).privateKey
          const feePayerAccount = feePayerPrivateKey.toPublicKey();
      
          await this.storePrivateKey(fs, path, feePayerPrivateKey);
      
          console.log('Acquire feePayerPrivateKey ...');
      
        }
      
        let feePayerKeysBase58: { privateKey: string; publicKey: string } = 
        JSON.parse(
          await fs.readFile(path, 'utf8')
        );
      
        return  feePayerKeysBase58;
    }
      
    public static async initialKey(fs: any, path:string, tag: string)
    {
        // await fs.mkdir("keys");
        if (!(await this.isFileExists(fs, path))) {
          
          const zkAppPrivateKey = PrivateKey.random();
      
          await this.storePrivateKey(fs, path, zkAppPrivateKey);
      
          console.log(`Generate ${tag} ...`);
      
        }
      
        let zkAppKeysBase58: { privateKey: string; publicKey: string } = 
        JSON.parse(
          await fs.readFile(path, 'utf8')
        );
      
        return  zkAppKeysBase58;
    }

    public static async initialZkAppKey(fs: any, path:string)
    {
        return  this.initialKey(fs, path, "zkAppPrivateKey");
    }

    public static async deploy(config: any, feePayerKey: PrivateKey, zkAppKey: PrivateKey, zkApp: SmartContract, tag: string) {

        // Create a new instance of the contract
        console.log('\n\n====== DEPLOYING ======\n\n');
        const sentTx = await Mina.transaction({ sender: feePayerKey.toPublicKey(), fee: config.fee }, () => {
            AccountUpdate.fundNewAccount(feePayerKey.toPublicKey());
            zkApp.deploy();
        });

        await this.processTx(config, sentTx, [zkAppKey, feePayerKey], tag);
    }
    
}

import {
    SmartContract,
    state,
    State,
    method,
    DeployArgs,
    Permissions,
    UInt64,
    PublicKey,
    Signature,
    Field,
  } from 'o1js';

// export abstract class IBasicTokenContract extends SmartContract {
//     abstract deploy(): void;
// }
  
export async function buildBasicTokenContract(address: PublicKey, symbol: string):Promise<SmartContract> {

    class BasicTokenContract extends SmartContract {

        @state(UInt64) totalAmountInCirculation = State<UInt64>();
    
        public deploy() {
          super.deploy();
      
          const permissionToEdit = Permissions.proof();
      
          this.account.permissions.set({
            ...Permissions.default(),
            editState: permissionToEdit,
            setTokenSymbol: permissionToEdit,
            send: permissionToEdit,
            receive: permissionToEdit,
          });
        }
      
        @method init() {
          super.init();
          this.account.tokenSymbol.set(symbol);
          this.totalAmountInCirculation.set(UInt64.zero);
        }
      
        @method mint(
          receiverAddress: PublicKey,
          amount: UInt64,
          adminSignature: Signature
        ) {
          let totalAmountInCirculation = this.totalAmountInCirculation.get();
          this.totalAmountInCirculation.assertEquals(totalAmountInCirculation);
      
          let newTotalAmountInCirculation = totalAmountInCirculation.add(amount);
      
          adminSignature
            .verify(
              this.address,
              amount.toFields().concat(receiverAddress.toFields())
            )
            .assertTrue();
      
          this.token.mint({
            address: receiverAddress,
            amount,
          });
      
          this.totalAmountInCirculation.set(newTotalAmountInCirculation);
        }
      
        @method sendTokens(
          senderAddress: PublicKey,
          receiverAddress: PublicKey,
          amount: UInt64
        ) {
          this.token.send({
            from: senderAddress,
            to: receiverAddress,
            amount,
          });
        }
    }

    await BasicTokenContract.compile();

    return new BasicTokenContract(address);
}
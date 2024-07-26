import {
  CircuitString,
  Field,
  method,
  PublicKey,
  SmartContract,
  UInt64,
  state,
  Experimental,
} from 'o1js';

const { OffchainState } = Experimental;


const proofsEnabled = true;

export abstract class IOC20 {
  abstract name: () => CircuitString;
  abstract symbol: () => CircuitString;
  abstract decimals: () => Field;
  abstract totalSupply(): Promise<UInt64>;
  abstract balanceOf(owner: PublicKey): Promise<UInt64>;
  abstract createAccount(address: PublicKey, amountToMint: UInt64): Promise<void>;
}

export async function buildOC20Contract(
  address: PublicKey,
  name: string,
  symbol: string,
  decimals: number
): Promise<SmartContract & IOC20> {

   const Oc20State = OffchainState(
    {
      accounts: OffchainState.Map(PublicKey, UInt64),
      totalSupply: OffchainState.Field(UInt64),
    },
    { logTotalCapacity: 10, maxActionsPerProof: 5 }
  );
  class Oc20StateProof extends Oc20State.Proof {}

  class Oc20Contract extends SmartContract implements IOC20 {
    @state(OffchainState.Commitments) offchainState = Oc20State.commitments();


    @method
    async createAccount(address: PublicKey, amountToMint: UInt64) {
      // setting `from` to `undefined` means that the account must not exist yet
      Oc20State.fields.accounts.update(address, {
        from: undefined,
        to: amountToMint,
      });

      // TODO using `update()` on the total supply means that this method
      // can only be called once every settling cycle
      let totalSupplyOption = await Oc20State.fields.totalSupply.get();
      let totalSupply = totalSupplyOption.orElse(0n);

      Oc20State.fields.totalSupply.update({
        from: totalSupplyOption,
        to: totalSupply.add(amountToMint),
      });
    }

    @method
    async transfer(from: PublicKey, to: PublicKey, amount: UInt64) {
      let fromOption = await Oc20State.fields.accounts.get(from);
      let fromBalance = fromOption.assertSome('sender account exists');

      let toOption = await Oc20State.fields.accounts.get(to);
      let toBalance = toOption.orElse(0n);

      Oc20State.fields.accounts.update(from, {
        from: fromOption,
        to: fromBalance.sub(amount),
      });
      Oc20State.fields.accounts.update(to, {
        from: toOption,
        to: toBalance.add(amount),
      });
    }

    name(): CircuitString {
      return CircuitString.fromString(name);
    }

    symbol(): CircuitString {
      return CircuitString.fromString(symbol);
    }

    decimals(): Field {
      return Field(decimals);
    }

    @method.returns(UInt64)
    async totalSupply() {
      return (await Oc20State.fields.totalSupply.get()).orElse(0n);
    }

    @method.returns(UInt64)
    async balanceOf(address: PublicKey) {
      return (await Oc20State.fields.accounts.get(address)).orElse(0n);
    }

    @method
    async settle(proof: Oc20StateProof) {
      await Oc20State.settle(proof);
    }
  }

  let contract = new Oc20Contract(address);
  Oc20State.setContractInstance(contract);

  if (proofsEnabled) {
    console.time('compile program');
    await Oc20State.compile();
    console.timeEnd('compile program');
    console.time('compile contract');
    await Oc20Contract.compile();
    console.timeEnd('compile contract');
  }

  return contract;
}

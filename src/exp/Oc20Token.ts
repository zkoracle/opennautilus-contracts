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

export const Oc20State = OffchainState(
  {
    name: OffchainState.Field(CircuitString),
    symbol: OffchainState.Field(CircuitString),
    decimals: OffchainState.Field(Field),
    accounts: OffchainState.Map(PublicKey, UInt64),
    totalSupply: OffchainState.Field(UInt64),
  },
  { logTotalCapacity: 10, maxActionsPerProof: 5 }
);

export class Oc20StateProof extends Oc20State.Proof {}

export abstract class IOC20 {
  abstract name?: () => CircuitString;
  abstract symbol?: () => CircuitString;
  abstract decimals?: () => Field;
  abstract totalSupply(): Promise<UInt64>;
  abstract balanceOf(owner: PublicKey): Promise<UInt64>;
}

export async function buildOC20Contract(
  address: PublicKey,
  name: string,
  symbol: string,
  decimals: number
): Promise<SmartContract & IOC20> {
  class Oc20Contract extends SmartContract implements IOC20 {
    @state(OffchainState.Commitments) Oc20State =
      Oc20State.commitments();

    // constructor() {
    //
    //   // this.account.tokenSymbol.set(symbol);
    //   // this.totalAmountInCirculation = 0;
    // }

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

  return new Oc20Contract(address);
}

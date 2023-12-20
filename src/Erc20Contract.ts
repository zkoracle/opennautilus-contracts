import { Field, SmartContract, state, State, method, CircuitString, UInt64, PublicKey, Bool, ProvablePure, provablePure } from 'o1js';

/**
   * ERC-20 token standard.
   * https://ethereum.org/en/developers/docs/standards/tokens/erc-20/
   */

export type Erc20 = {
  // pure view functions which don't need @method
  name?: () => CircuitString;
  symbol?: () => CircuitString;
  decimals?: () => Field; // TODO: should be UInt8 which doesn't exist yet
  totalSupply(): UInt64;
  balanceOf(owner: PublicKey): UInt64;
  allowance(owner: PublicKey, spender: PublicKey): UInt64;

  // mutations which need @method
  transfer(to: PublicKey, value: UInt64): Bool; // emits "Transfer" event
  transferFrom(from: PublicKey, to: PublicKey, value: UInt64): Bool; // emits "Transfer" event
  approveSpend(spender: PublicKey, value: UInt64): Bool; // emits "Approve" event

  // events
  events: {
    Transfer: ProvablePure<{
      from: PublicKey;
      to: PublicKey;
      value: UInt64;
    }>;
    Approval: ProvablePure<{
      owner: PublicKey;
      spender: PublicKey;
      value: UInt64;
    }>;
  };

};

export class Erc20Contract extends SmartContract implements Erc20 {
  
  events = {
    Transfer: provablePure({
        from: PublicKey,
        to: PublicKey,
        value: UInt64,
    }),
    Approval: provablePure({
        owner: PublicKey,
        spender: PublicKey,
        value: UInt64,
    }),
  };
  
  init() {
    super.init();
  }

  @method name(): CircuitString {
    return CircuitString.fromString('SomeCoin');
  }
  @method symbol(): CircuitString {
      return CircuitString.fromString('SOM');
  }
  @method decimals(): Field {
      return Field(9);
  }

  @method totalSupply(): UInt64 {
    throw new Error('Method not implemented.');
  }
  @method balanceOf(owner: PublicKey): UInt64 {
    throw new Error('Method not implemented.');
  }
  @method allowance(owner: PublicKey, spender: PublicKey): UInt64 {
    throw new Error('Method not implemented.');
  }
  @method transfer(to: PublicKey, value: UInt64): Bool {
    throw new Error('Method not implemented.');
  }
  @method transferFrom(from: PublicKey, to: PublicKey, value: UInt64): Bool {
    throw new Error('Method not implemented.');
  }
  @method approveSpend(spender: PublicKey, value: UInt64): Bool {
    throw new Error('Method not implemented.');
  }

}

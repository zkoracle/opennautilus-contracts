import {
  ProvablePure,
  Bool,
  CircuitString,
  provablePure,
  DeployArgs,
  Field,
  method,
  AccountUpdate,
  PublicKey,
  SmartContract,
  UInt64,
  Account,
  Experimental,
  Permissions,
  Mina,
  Int64,
  VerificationKey,
  State,
  state,
} from 'o1js';

/**
 * Represents a standard interface for fungible tokens, implementing the ERC20 standard.
 *
 * @remarks
 * This abstract class defines a set of functions that tokens must implement to be compatible with
 * the ERC20 standard. It provides basic functionality for tracking token balances, transfers, and
 * approvals.
 *
 * @example
 * ```typescript
 * class MyToken implements IERC20 {
 *   // Implementation of IERC20 methods
 * }
 *
 */
export abstract class IERC20 {
  /**
   * @optional
   * @returns The name of the token, as a CircuitString.
   */
  abstract name?: () => CircuitString;
  /**
   * @optional
   * @returns The symbol of the token, as a CircuitString.
   */
  abstract symbol?: () => CircuitString;
  /**
   * @optional
   * @returns The number of decimals used to represent token amounts, as a Field.
   * @todo Should be UInt8 when available.
   */
  abstract decimals?: () => Field; // TODO: should be UInt8 which doesn't exist yet
  /**
   * @returns The total token supply, as a UInt64.
   */
  abstract totalSupply(): UInt64;
  /**
   * @param owner The address of the token owner.
   * @returns The balance of the owner, as a UInt64.
   */
  abstract balanceOf(owner: PublicKey): UInt64;
  /**
   * @param owner The address of the token owner.
   * @param spender The address of the spender.
   * @returns The amount of tokens approved for the spender to spend on behalf of the owner, as a UInt64.
   */
  abstract allowance(owner: PublicKey, spender: PublicKey): UInt64;

  /**
   * @method
   * @param to The address to transfer tokens to.
   * @param value The amount of tokens to transfer.
   * @returns True if the transfer was successful, false otherwise.
   * @emits Transfer
   *
   * @remarks
   * mutations which need @method
   */
  abstract transfer(to: PublicKey, value: UInt64): Bool; // emits "Transfer" event

  /**
   * @method
   * @param from The address to transfer tokens from.
   * @param to The address to transfer tokens to.
   * @param value The amount of tokens to transfer.
   * @returns True if the transfer was successful, false otherwise.
   * @emits Transfer
   *
   * @remarks
   * mutations which need @method
   */
  abstract transferFrom(from: PublicKey, to: PublicKey, value: UInt64): Bool; // emits "Transfer" event

  /**
   * @method
   * @param spender The address to approve as a spender.
   * @param value The amount of tokens to approve.
   * @returns True if the approval was successful, false otherwise.
   * @emits Approval
   *
   * @remarks
   * mutations which need @method
   */
  abstract approveSpend(spender: PublicKey, value: UInt64): Bool; // emits "Approve" event

  /**
   * Events emitted by the contract.
   */
  events: {
    /**
     * Emitted when tokens are transferred.
     */
    Transfer: ProvablePure<{
      from: PublicKey;
      to: PublicKey;
      value: UInt64;
    }>;
    /**
     * Emitted when an allowance is approved.
     */
    Approval: ProvablePure<{
      owner: PublicKey;
      spender: PublicKey;
      value: UInt64;
    }>;
  };
}

// NotFixed

/**
 * Constructs and deploys an ERC20 token contract.
 *
 * @remarks
 * This function creates a new contract class that implements the `IERC20` interface, compiles it, and deploys it to the blockchain.
 * The returned contract instance can be used to interact with the token's functionality.
 *
 * @example
 * ```typescript
 * const myToken = await buildERC20Contract(address, 'MyToken', 'MTK', 18);
 * // Interact with the token contract using the `myToken` instance
 * ```
 *
 * @param address The address of the token contract on the blockchain.
 * @param name The name of the token.
 * @param symbol The symbol of the token.
 * @param decimals The number of decimals used to represent token amounts.
 * @returns A promise that resolves to the deployed contract instance.
 */
export async function buildERC20Contract(
  address: PublicKey,
  name: string,
  symbol: string,
  decimals: number
): Promise<SmartContract & IERC20> {
  /**
   * Represents an ERC20 token contract implementation.
   *
   * @remarks
   * This class extends the `SmartContract` class and implements the `IERC20` interface to provide core ERC20 token functionality.
   * It manages token balances, transfers, and approvals, adhering to the ERC20 standard.
   *
   */
  class Erc20Contract extends SmartContract implements IERC20 {
    /**
     * Stores the total amount of tokens in circulation.
     *
     * @type {State<UInt64>}
     */
    @state(UInt64) totalAmountInCirculation = State<UInt64>();

    /**
     * Deploys the contract to the blockchain and configures permissions.
     *
     * @remarks
     * This method sets up proof-based permissions for sensitive actions.
     */
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

    /**
     * @returns The name of the token, as a CircuitString.
     * @remarks
     * This method adheres to the ERC20 standard for retrieving the token's name.
     * It converts the stored string name into a CircuitString for compatibility with zkApp operations.
     */
    name(): CircuitString {
      return CircuitString.fromString(name);
    }
    /**
     * @returns The symbol of the token, as a CircuitString.
     * @remarks
     * This method adheres to the ERC20 standard for retrieving the token's symbol.
     * It converts the stored string symbol into a CircuitString for compatibility with zkApp operations.
     */
    symbol(): CircuitString {
      return CircuitString.fromString(symbol);
    }
    /**
     * @returns The number of decimals used to represent token amounts, as a Field.
     * @todo Should be UInt8 when available.
     */
    decimals(): Field {
      return Field(decimals);
    }
    /**
     * @returns The total token supply, as a UInt64.
     * @remarks
     * This method accesses the `totalAmountInCirculation` state variable to provide the current token supply.
     */
    totalSupply(): UInt64 {
      return this.totalAmountInCirculation.get();
    }

    /**
     * @param owner The address of the token owner.
     * @returns The balance of the owner, as a UInt64.
     * @remarks
     * Fetches the balance from the owner's account state and verifies its integrity using `requireEquals`.
     * This check ensures data consistency and helps prevent potential issues.
     */
    balanceOf(owner: PublicKey): UInt64 {
      let account = Account(owner, this.token.id);
      let balance = account.balance.get();
      account.balance.requireEquals(balance);
      return balance;
    }
    /**
     * @param owner The address of the token owner.
     * @param spender The address of the spender.
     * @returns The amount of tokens approved for the spender, as a UInt64.
     * @todo Implement allowance functionality to enable approved spending.
     */
    allowance(owner: PublicKey, spender: PublicKey): UInt64 {
      // TODO: implement allowances
      return UInt64.zero;
    }
    /**
     * @method
     * @param to The address to transfer tokens to.
     * @param value The amount of tokens to transfer.
     * @returns True if the transfer was successful, false otherwise.
     * @emits Transfer
     * @remarks
     * Leverages the zkApp protocol to handle balance checks and transfer logic securely.
     * Directly emits a Transfer event to signal the token transfer.
     */
    @method transfer(to: PublicKey, value: UInt64): Bool {
      this.token.send({ from: this.sender, to, amount: value });
      this.emitEvent('Transfer', { from: this.sender, to, value });
      // we don't have to check the balance of the sender -- this is done by the zkApp protocol
      return Bool(true);
    }
    /**
     * @method
     * @param from The address to transfer tokens from.
     * @param to The address to transfer tokens to.
     * @param value The amount of tokens to transfer.
     * @returns True if the transfer was successful, false otherwise.
     * @emits Transfer
     * @remarks
     * Similar to `transfer()`, but allows transferring tokens from a specified address, often for approved spending.
     * Also relies on the zkApp protocol for secure balance checks and emits a Transfer event.
     */
    @method transferFrom(from: PublicKey, to: PublicKey, value: UInt64): Bool {
      this.token.send({ from, to, amount: value });
      this.emitEvent('Transfer', { from, to, value });
      // we don't have to check the balance of the sender -- this is done by the zkApp protocol
      return Bool(true);
    }
    /**
     * @method
     * @param spender The address to approve as a spender.
     * @param value The amount of tokens to approve.
     * @returns True if the approval was successful, false otherwise.
     * @emits Approval
     * @todo Implement allowance functionality to enable token approvals.
     */
    @method approveSpend(spender: PublicKey, value: UInt64): Bool {
      // TODO: implement allowances
      return Bool(false);
    }

    /**
     * Events emitted by the contract to signal important state changes.
     */
    events = {
      /**
       * Emitted when tokens are transferred.
       */
      Transfer: provablePure({
        from: PublicKey,
        to: PublicKey,
        value: UInt64,
      }),

      /**
       * Emitted when an allowance is approved.
       */
      Approval: provablePure({
        owner: PublicKey,
        spender: PublicKey,
        value: UInt64,
      }),
    };
  }

  await Erc20Contract.compile(); // Compile

  return new Erc20Contract(address);
}

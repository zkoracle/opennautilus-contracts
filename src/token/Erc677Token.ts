import {
  ProvablePure,
  Bool,
  CircuitString,
  provablePure,
  Field,
  method,
  PublicKey,
  SmartContract,
  UInt64,
  Account,
  Permissions,
  State,
  state,
} from 'o1js';
import { IERC20, IERC20Events, ERC20Events } from './Erc20Token';

/**
 * Represents the events emitted by an ERC677 token contract.
 *
 * Extends the standard ERC20 events with an additional `TransferAndCall` event.
 * This event is used to signal a token transfer that also triggers a call to a
 * specified contract method.
 *
 * @type {IERC20Events & { TransferAndCall: ProvablePure<TransferAndCallArgs> }}
 */
export type IERC677Events = IERC20Events & {
  TransferAndCall: ProvablePure<{
    from: PublicKey;
    to: PublicKey;
    value: UInt64;
    data: CircuitString;
  }>;
};

/**
 * Defines the structure of a TransferAndCall event, typically used in the context of an ERC677 token contract.
 *
 * @type {Object}
 * @property {ProvablePure<TransferAndCallArgs>} TransferAndCall - A function that represents the event,
 *                                                              ensuring it's pure (no side effects) and provable.
 */
const TransferAndCallEvent = {
  /**
   * The TransferAndCall event function.
   *
   * @type {ProvablePure<TransferAndCallArgs>}
   */
  TransferAndCall: provablePure({
    /**
     * The address of the sender.
     *
     * @type {PublicKey}
     */
    from: PublicKey,
    /**
     * The address of the recipient.
     *
     * @type {PublicKey}
     */
    to: PublicKey,
    /**
     * The amount of tokens transferred.
     *
     * @type {UInt64}
     */
    value: UInt64,
    /**
     * Additional data to be passed to the contract method.
     *
     * @type {CircuitString}
     */
    data: CircuitString,
  }),
};
/**
 * Exports an object containing all events emitted by an ERC677 token contract.
 *
 * Combines the standard ERC20 events with the `TransferAndCall` event, providing
 * a comprehensive representation of token transfer activities and contract calls.
 *
 * @type {IERC677Events}
 * @readonly
 */
export const ERC677Events: IERC677Events = {
  ...ERC20Events,
  ...TransferAndCallEvent,
};
/**
 * Defines the interface for an ERC677 token contract.
 *
 * Extends the standard ERC20 interface with the additional `transferAndCall` method,
 * enabling token transfers that also trigger contract calls.
 *
 * @abstract
 * @extends {IERC20}
 */
export abstract class IERC677 extends IERC20 {
  /**
   * Transfers tokens to a recipient and calls a contract method.
   *
   * @param {PublicKey} to - The address of the recipient.
   * @param {UInt64} value - The amount of tokens to transfer.
   * @param {CircuitString} data - Additional data to be passed to the contract method.
   * @returns {Bool} - True if the transfer and call were successful, false otherwise.
   * @emits Transfer - Emitted when the transfer is successful.
   */
  abstract transferAndCall(
    to: PublicKey,
    value: UInt64,
    data: CircuitString
  ): Bool; // emits "Transfer" event
  /**
   * The events emitted by the contract.
   *
   * @type {IERC677Events}
   * @readonly
   */
  events: IERC677Events;
}
/**
 * Builds and returns an instance of an ERC677 token contract.
 *
 * @param {PublicKey} address - The contract address.
 * @param {string} name - The token name.
 * @param {string} symbol - The token symbol.
 * @param {number} decimals - The number of decimals for token precision.
 * @returns {Promise<SmartContract & IERC677>} - A promise that resolves to the constructed contract instance.
 */
export async function buildERC677Contract(
  address: PublicKey,
  name: string,
  symbol: string,
  decimals: number
): Promise<SmartContract & IERC677> {
  /**
   * Internal class representing the ERC677 contract implementation.
   */
  class Erc677Contract extends SmartContract implements IERC677 {
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
     * Initializes the contract after deployment.
     *
     * @remarks
     * This method performs the following steps:
     * 1. Calls the superclass's `init` method to handle any base initialization tasks.
     * 2. Sets the token symbol for the contract.
     * 3. Initializes the total amount of tokens in circulation to zero.
     */
    @method init() {
      super.init();
      this.account.tokenSymbol.set(symbol);
      this.totalAmountInCirculation.set(UInt64.zero);
    }

    /**
     * @returns The name of the token, as a CircuitString.
     * @remarks
     * This method adheres to the ERC677 standard for retrieving the token's name.
     * It converts the stored string name into a CircuitString for compatibility with zkApp operations.
     */
    name(): CircuitString {
      return CircuitString.fromString(name);
    }
    /**
     * @returns The symbol of the token, as a CircuitString.
     * @remarks
     * This method adheres to the ERC677 standard for retrieving the token's symbol.
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
     * Transfers tokens to a recipient and optionally calls a contract method.
     *
     * @param {PublicKey} to - The address of the recipient.
     * @param {UInt64} value - The amount of tokens to transfer.
     * @param {CircuitString} data - Additional data to be passed to the contract method, if applicable.
     * @returns {Bool} - Returns `false` in the current implementation.
     * @emits TransferAndCall - Emitted when the transfer is successful.
     */
    transferAndCall(to: PublicKey, value: UInt64, data: CircuitString): Bool {
      this.token.send({ from: this.sender, to, amount: value });
      this.emitEvent('TransferAndCall', { from: this.sender, to, value, data });

      // const oracleContract = new OracleContract(to);
      // oracleContract.onTokenTransfer(this.sender, value, data);

      // we don't have to check the balance of the sender -- this is done by the zkApp protocol

      return Bool(false);
    }
    /**
     * Events emitted by the contract.
     */
    events = ERC677Events;
  }

  await Erc677Contract.compile(); // Compile

  return new Erc677Contract(address);
}

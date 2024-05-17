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
  Experimental,
  AccountUpdate,
  TokenContract,
  AccountUpdateForest,
} from 'o1js';
import { IERC20, IERC20Events, ERC20Events } from './Erc20Token.js';
import { OracleContract } from '../zkapp/OracleContract.js';

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
    data0: Field;
    data1: Field;
    data2: Field;
    data3: Field;
  }>;
};

/**
 * Defines the structure of a TransferAndCall event, typically used in the context of an ERC677 token contract.
 *
 * @type {Object}
 * @property {ProvablePure<TransferAndCallArgs>} TransferAndCall - A function that represents the event,
 *                                                              ensuring its pure (no side effects) and provable.
 */
const TransferAndCallEvent = {
  /**
   * The TransferAndCall event function.
   *
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

    data0: Field,
    data1: Field,
    data2: Field,
    data3: Field,
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
   * @param {Field} data0 - The first additional field to be passed to the contract method, if applicable.
   * @param {Field} data1 - The second additional field to be passed to the contract method, if applicable.
   * @param {Field} data2 - The third additional field to be passed to the contract method, if applicable.
   * @param {Field} data3 - The fourth additional field to be passed to the contract method, if applicable.
   * @returns {Bool} - True if the transfer and call were successful, false otherwise.
   * @emits Transfer - Emitted when the transfer is successful.
   */
  abstract transferAndCall(
    to: PublicKey,
    value: UInt64,
    data0: Field,
    data1: Field,
    data2: Field,
    data3: Field
  ): Promise<void>; // emits "Transfer" event
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
): Promise<TokenContract & IERC677> {
  /**
   * Internal class representing the ERC677 contract implementation.
   */
  class Erc677Contract extends TokenContract implements IERC677 {
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
    public async deploy() {
      await super.deploy();

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
    init() {
      super.init();
      this.account.tokenSymbol.set(symbol);
      this.totalAmountInCirculation.set(UInt64.zero);
    }

    @method async approveBase(forest: AccountUpdateForest) {
      this.checkZeroBalanceChange(forest);
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

    async balanceOf(owner: PublicKey | AccountUpdate): Promise<UInt64> {
      let update =
        owner instanceof PublicKey
          ? AccountUpdate.create(owner, this.deriveTokenId())
          : owner;
      await this.approveAccountUpdate(update);
      return update.account.balance.getAndRequireEquals();
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
     * Mints new tokens and assigns them to a receiver.
     *
     * @remarks
     * This method assumes that authorization checks for minting are handled elsewhere.
     * It directly performs the following steps:
     * 1. Retrieves the current total supply of tokens in circulation.
     * 2. Asserts consistency of the retrieved state value.
     * 3. Calculates the new total supply after minting.
     * 4. Calls the underlying token module to mint the new tokens.
     * 5. Updates the total token supply in the contract's state.
     *
     * @param receiverAddress - The address of the receiver who will receive the newly minted tokens
     * @param amount - The amount of tokens to mint
     */
    @method async mint(receiverAddress: PublicKey, amount: UInt64) {
      let totalAmountInCirculation = this.totalAmountInCirculation.get();
      this.totalAmountInCirculation.requireEquals(totalAmountInCirculation);
      // this.totalAmountInCirculation.assertEquals(totalAmountInCirculation);
      let newTotalAmountInCirculation = totalAmountInCirculation.add(amount);

      this.internal.mint({
        address: receiverAddress,
        amount,
      });
      this.totalAmountInCirculation.set(newTotalAmountInCirculation);
    }

    /**
     * Burns (destroys) existing tokens, reducing the total supply.
     *
     * @remarks
     * This method assumes that authorization checks for burning are handled elsewhere.
     * It directly performs the following steps:
     * 1. Retrieves the current total supply of tokens in circulation.
     * 2. Asserts consistency of the retrieved state value.
     * 3. Calculates the new total supply after burning.
     * 4. Calls the underlying token module to burn the specified tokens.
     * 5. Updates the total token supply in the contract's state.
     *
     * @param receiverAddress - The address of the token holder whose tokens will be burned
     * @param amount - The amount of tokens to burn
     *
     * @warning This method does not explicitly check for authorization to burn tokens.
     *          It's essential to ensure that appropriate authorization mechanisms are in place
     *          to prevent unauthorized token burning.
     */
    @method async burn(receiverAddress: PublicKey, amount: UInt64) {
      let totalAmountInCirculation = this.totalAmountInCirculation.get();
      this.totalAmountInCirculation.requireEquals(totalAmountInCirculation);
      // this.totalAmountInCirculation.assertEquals(totalAmountInCirculation);
      let newTotalAmountInCirculation = totalAmountInCirculation.sub(amount);

      this.internal.burn({
        address: receiverAddress,
        amount,
      });

      this.totalAmountInCirculation.set(newTotalAmountInCirculation);
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
    @method async transferFrom(from: PublicKey, to: PublicKey, value: UInt64) {
      this.internal.send({ from, to, amount: value });
      this.emitEvent('Transfer', { from, to, value });
      // we don't have to check the balance of the sender -- this is done by the zkApp protocol
    }
    /**
     * @method
     * @param spender The address to approve as a spender.
     * @param value The amount of tokens to approve.
     * @returns True if the approval was successful, false otherwise.
     * @emits Approval
     * @todo Implement allowance functionality to enable token approvals.
     */
    @method async approveSpend(spender: PublicKey, value: UInt64) {
      // TODO: implement allowances
    }

    /**
     * Transfers tokens to a recipient and optionally calls a contract method.
     *
     * @param {PublicKey} to - The address of the recipient.
     * @param {UInt64} value - The amount of tokens to transfer.
     * @param data0 - The first additional field to be passed to the contract method, if applicable.
     * @param data1 - The second additional field to be passed to the contract method, if applicable.
     * @param data2 - The third additional field to be passed to the contract method, if applicable.
     * @param data3 - The fourth additional field to be passed to the contract method, if applicable.
     * @returns {Bool} - Returns `false` in the current implementation.
     * @emits TransferAndCall - Emitted when the transfer is successful.
     */
    @method async transferAndCall(
      to: PublicKey,
      value: UInt64,
      data0: Field,
      data1: Field,
      data2: Field,
      data3: Field
    ) {
      this.internal.send({
        from: this.sender.getAndRequireSignature(),
        to,
        amount: value,
      });

      const oracleContract = new OracleContract(to);
      await oracleContract.oracleRequest(data0, data1, data2, data3);

      // we don't have to check the balance of the sender -- this is done by the zkApp protocol
    }
    /**
     * Events emitted by the contract.
     */
    events = ERC677Events;
  }

  await Erc677Contract.compile(); // Compile

  return new Erc677Contract(address);
}

export class SErc677Contract extends TokenContract implements IERC677 {
  static staticSymbol = '';
  static staticName = '';
  static staticDecimals = 0;

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
  public async deploy() {
    await super.deploy();

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
  init() {
    super.init();
    this.account.tokenSymbol.set(SErc677Contract.staticSymbol);
    this.totalAmountInCirculation.set(UInt64.zero);
  }

  @method async approveBase(forest: AccountUpdateForest) {
    this.checkZeroBalanceChange(forest);
  }

  /**
   * @returns The name of the token, as a CircuitString.
   * @remarks
   * This method adheres to the ERC677 standard for retrieving the token's name.
   * It converts the stored string name into a CircuitString for compatibility with zkApp operations.
   */
  name(): CircuitString {
    return CircuitString.fromString(SErc677Contract.staticName);
  }
  /**
   * @returns The symbol of the token, as a CircuitString.
   * @remarks
   * This method adheres to the ERC677 standard for retrieving the token's symbol.
   * It converts the stored string symbol into a CircuitString for compatibility with zkApp operations.
   */
  symbol(): CircuitString {
    return CircuitString.fromString(SErc677Contract.staticSymbol);
  }
  /**
   * @returns The number of decimals used to represent token amounts, as a Field.
   * @todo Should be UInt8 when available.
   */
  decimals(): Field {
    return Field(SErc677Contract.staticDecimals);
  }
  /**
   * @returns The total token supply, as a UInt64.
   * @remarks
   * This method accesses the `totalAmountInCirculation` state variable to provide the current token supply.
   */
  totalSupply(): UInt64 {
    return this.totalAmountInCirculation.get();
  }

  async balanceOf(owner: PublicKey | AccountUpdate): Promise<UInt64> {
    let update =
      owner instanceof PublicKey
        ? AccountUpdate.create(owner, this.deriveTokenId())
        : owner;
    await this.approveAccountUpdate(update);
    return update.account.balance.getAndRequireEquals();
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
   * Mints new tokens and assigns them to a receiver.
   *
   * @remarks
   * This method assumes that authorization checks for minting are handled elsewhere.
   * It directly performs the following steps:
   * 1. Retrieves the current total supply of tokens in circulation.
   * 2. Asserts consistency of the retrieved state value.
   * 3. Calculates the new total supply after minting.
   * 4. Calls the underlying token module to mint the new tokens.
   * 5. Updates the total token supply in the contract's state.
   *
   * @param receiverAddress - The address of the receiver who will receive the newly minted tokens
   * @param amount - The amount of tokens to mint
   */
  @method async mint(receiverAddress: PublicKey, amount: UInt64) {
    let totalAmountInCirculation = this.totalAmountInCirculation.get();
    this.totalAmountInCirculation.requireEquals(totalAmountInCirculation);
    // this.totalAmountInCirculation.assertEquals(totalAmountInCirculation);
    let newTotalAmountInCirculation = totalAmountInCirculation.add(amount);

    this.internal.mint({
      address: receiverAddress,
      amount,
    });
    this.totalAmountInCirculation.set(newTotalAmountInCirculation);
  }

  /**
   * Burns (destroys) existing tokens, reducing the total supply.
   *
   * @remarks
   * This method assumes that authorization checks for burning are handled elsewhere.
   * It directly performs the following steps:
   * 1. Retrieves the current total supply of tokens in circulation.
   * 2. Asserts consistency of the retrieved state value.
   * 3. Calculates the new total supply after burning.
   * 4. Calls the underlying token module to burn the specified tokens.
   * 5. Updates the total token supply in the contract's state.
   *
   * @param receiverAddress - The address of the token holder whose tokens will be burned
   * @param amount - The amount of tokens to burn
   *
   * @warning This method does not explicitly check for authorization to burn tokens.
   *          It's essential to ensure that appropriate authorization mechanisms are in place
   *          to prevent unauthorized token burning.
   */
  @method async burn(receiverAddress: PublicKey, amount: UInt64) {
    let totalAmountInCirculation = this.totalAmountInCirculation.get();
    this.totalAmountInCirculation.requireEquals(totalAmountInCirculation);
    // this.totalAmountInCirculation.assertEquals(totalAmountInCirculation);
    let newTotalAmountInCirculation = totalAmountInCirculation.sub(amount);

    this.internal.burn({
      address: receiverAddress,
      amount,
    });

    this.totalAmountInCirculation.set(newTotalAmountInCirculation);
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
  @method async transferFrom(from: PublicKey, to: PublicKey, value: UInt64) {
    this.internal.send({ from, to, amount: value });
    this.emitEvent('Transfer', { from, to, value });
    // we don't have to check the balance of the sender -- this is done by the zkApp protocol
  }

  /**
   * @method
   * @param spender The address to approve as a spender.
   * @param value The amount of tokens to approve.
   * @returns True if the approval was successful, false otherwise.
   * @emits Approval
   * @todo Implement allowance functionality to enable token approvals.
   */
  @method async approveSpend(spender: PublicKey, value: UInt64) {
    // TODO: implement allowances
  }

  /**
   * Transfers tokens to a recipient and optionally calls a contract method.
   *
   * @param {PublicKey} to - The address of the recipient.
   * @param {UInt64} value - The amount of tokens to transfer.
   * @param data0 - The first additional field to be passed to the contract method, if applicable.
   * @param data1 - The second additional field to be passed to the contract method, if applicable.
   * @param data2 - The third additional field to be passed to the contract method, if applicable.
   * @param data3 - The fourth additional field to be passed to the contract method, if applicable.
   * @returns {Bool} - Returns `false` in the current implementation.
   * @emits TransferAndCall - Emitted when the transfer is successful.
   */
  @method async transferAndCall(
    to: PublicKey,
    value: UInt64,
    data0: Field,
    data1: Field,
    data2: Field,
    data3: Field
  ) {
    this.internal.send({
      from: this.sender.getAndRequireSignature(),
      to,
      amount: value,
    });
    // this.emitEvent('TransferAndCall', {
    //   from: this.sender,
    //   to,
    //   value,
    //   data0,
    //   data1,
    //   data2,
    //   data3,
    // });

    const oracleContract = new OracleContract(to);
    await oracleContract.oracleRequest(data0, data1, data2, data3);

    // we don't have to check the balance of the sender -- this is done by the zkApp protocol
  }
  /**
   * Events emitted by the contract.
   */
  events = ERC677Events;
}

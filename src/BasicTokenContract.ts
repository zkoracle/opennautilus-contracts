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

/**
 * Defines the basic interface for a token contract.
 *
 * All token contracts should inherit from this class and implement its methods.
 *
 * @remarks
 * This class is designed to provide a standardized way of interacting with token contracts,
 * ensuring consistency and interoperability across different implementations.
 */
export abstract class IBasicTokenContract {
  /**
   * Deploys the token contract to the blockchain.
   *
   * @remarks
   * This method should handle all necessary steps for deploying the contract,
   * such as configuring ownership.
   */
  abstract deploy(): void;

  /**
   * Initializes the token contract after deployment.
   *
   * @remarks
   * This method is used to perform any additional setup tasks after the contract is deployed,
   * such as setting initial token balances or defining access control rules.
   */
  abstract init(): void;

  /**
   * Mints new tokens and assigns them to a receiver.
   *
   * @param receiverAddress - The address of the receiver who will receive the newly minted tokens
   * @param amount - The amount of tokens to mint
   * @param adminSignature - A signature from an authorized administrator, required to approve the minting
   */
  abstract mint(
    receiverAddress: PublicKey,
    amount: UInt64,
    adminSignature: Signature
  ): void;

  /**
   * Sends tokens from one address to another.
   *
   * @param senderAddress - The address of the sender who is transferring the tokens
   * @param receiverAddress - The address of the receiver who will receive the tokens
   * @param amount - The amount of tokens to transfer
   */
  abstract sendTokens(
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    amount: UInt64
  ): void;
}

/**
 * Creates a basic token contract instance.
 *
 * @param address - The address where the contract will be deployed
 * @param symbol - The symbol for the token (e.g., "MYTOKEN")
 * @returns A promise that resolves to the created token contract instance
 *
 * @remarks
 * This function handles the following steps:
 * 1. Compiles the `BasicTokenContract` class.
 * 2. Initializes the contract with the provided symbol.
 * 3. Sets up necessary permissions for the contract.
 * 4. Returns the newly created contract instance.
 */
export async function buildBasicTokenContract(
  address: PublicKey,
  symbol: string
): Promise<SmartContract & IBasicTokenContract> {
  class BasicTokenContract
    extends SmartContract
    implements IBasicTokenContract
  {
    /**
     * Stores the total amount of tokens in circulation.
     *
     * @type {State<UInt64>}
     * @remarks
     * This state variable is crucial for tracking the supply of tokens within the contract.
     * It's updated during minting and potentially other token-related operations to ensure accurate accounting.
     */
    @state(UInt64) totalAmountInCirculation = State<UInt64>();

    /**
     * Deploys the contract to the blockchain and configures permissions.
     *
     * @remarks
     * This method performs the following steps:
     * 1. Calls the superclass's `deploy` method to handle initial deployment tasks.
     * 2. Creates a proof-based permission that requires a valid signature for authorization.
     * 3. Sets the contract's permissions to restrict actions:
     *   - `editState`: Requires proof to modify contract state.
     *   - `setTokenSymbol`: Requires proof to change the token symbol.
     *   - `send`: Requires proof to send tokens from the contract.
     *   - `receive`: Requires proof to receive tokens into the contract.
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
     * Mints new tokens and assigns them to a receiver.
     *
     * @remarks
     * This function performs the following steps:
     * 1. Retrieves the current total supply of tokens in circulation.
     * 2. Asserts consistency of the retrieved state value.
     * 3. Verifies that the minting process is authorized by an administrator.
     * 4. Calls the underlying token module to mint the new tokens.
     * 5. Updates the total token supply in the contract's state.
     *
     * @param receiverAddress - The address of the receiver who will receive the newly minted tokens
     * @param amount - The amount of tokens to mint
     * @param adminSignature - A signature from an authorized administrator, required to approve the minting
     */
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

    /**
     * Sends tokens from one address to another.
     *
     * @remarks
     * This function delegates the transfer of tokens to the underlying token module.
     * It does not directly handle token accounting or permissions within this contract.
     *
     * @param senderAddress - The address of the sender who is transferring the tokens
     * @param receiverAddress - The address of the receiver who will receive the tokens
     * @param amount - The amount of tokens to transfer
     */
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

  await BasicTokenContract.compile(); // Compile

  return new BasicTokenContract(address);
}

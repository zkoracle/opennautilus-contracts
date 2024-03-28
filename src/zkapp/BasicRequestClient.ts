import {
  Bool,
  Encoding,
  Field,
  PublicKey,
  SmartContract,
  State,
  method,
  state,
  Mina,
  UInt64,
} from 'o1js';
import { OracleContract, IOracleClient } from './OracleContract.js';
import { OracleRequest } from '../gen/oracle-request_pb.js';
import { buildERC677Contract, SErc677Contract } from '../token/Erc677Token.js';

/**
 * Builds a Mina transaction that sends an Oracle request to a designated zkApp with Addr.
 *
 * @param {Mina.FeePayerSpec} sender - The fee payer specification for the transaction.
 * @param {PublicKey} oracleAddress - The Oracle contract address to use.
 * @param {SmartContract & IOracleClient} zkApp - The zkApp contract that accepts Oracle requests, also implementing the `IOracleClient` interface.
 * @param {OracleRequest} oracleRequest - The data for the Oracle request, represented as an `OracleRequest` object.
 * @returns {Promise<Mina.Transaction>} - A promise that resolves to a Mina transaction containing the Oracle request.
 */
export async function buildOracleRequestTxWithAddr(
  sender: Mina.FeePayerSpec,
  oracleAddress: PublicKey,
  zkApp: SmartContract & IOracleClient,
  oracleRequest: OracleRequest
): Promise<Mina.Transaction> {
  const offChainBytes = oracleRequest.toBinary(); // Convert request data to binary
  const reqField = Encoding.bytesToFields(offChainBytes); // Convert binary to fields

  return Mina.transaction(sender, () => {
    zkApp.sendOracleRequestWithAddr(
      oracleAddress,
      reqField[0],
      reqField[1],
      reqField[2],
      reqField[3]
    );
  });
}

/**
 * Builds a Mina transaction that sends an Oracle request to a designated zkApp.
 *
 * @param {Mina.FeePayerSpec} sender - The fee payer specification for the transaction.
 * @param {SmartContract & IOracleClient} zkApp - The zkApp contract that accepts Oracle requests, also implementing the `IOracleClient` interface.
 * @param {OracleRequest} oracleRequest - The data for the Oracle request, represented as an `OracleRequest` object.
 * @returns {Promise<Mina.Transaction>} A promise that resolves to a Mina transaction containing the Oracle request.
 */
export async function buildOracleRequestTx(
  sender: Mina.FeePayerSpec,
  zkApp: SmartContract & IOracleClient,
  oracleRequest: OracleRequest
): Promise<Mina.Transaction> {
  const offChainBytes = oracleRequest.toBinary(); // Convert request data to binary
  const reqField = Encoding.bytesToFields(offChainBytes); // Convert binary to fields

  return Mina.transaction(sender, () => {
    zkApp.sendOracleRequest(reqField[0], reqField[1], reqField[2], reqField[3]);
  });
}

/**
 * Builds a transfer and call transaction.
 *
 * @param {Mina.FeePayerSpec} sender - The sender of the transaction.
 * @param {SmartContract & IOracleClient} zkApp - The smart contract that implements the OracleClient interface.
 * @param {OracleRequest} oracleRequest - The oracle request to be sent.
 * @return {Promise<Mina.Transaction>} A promise that resolves to the built transaction.
 */
export async function buildTransferAndCallTx(
  sender: Mina.FeePayerSpec,
  zkApp: SmartContract & IOracleClient,
  oracleRequest: OracleRequest
): Promise<Mina.Transaction> {
  const offChainBytes = oracleRequest.toBinary(); // Convert request data to binary
  const reqField = Encoding.bytesToFields(offChainBytes); // Convert binary to fields

  return Mina.transaction(sender, () => {
    zkApp.sendErc677RequestTo(reqField[0], reqField[1], reqField[2], reqField[3]);
  });
}

/**
 * A basic request client contract that implements the `IOracleClient` interface.
 */
export class BasicRequestClient extends SmartContract implements IOracleClient {
  /**
   * Represents an Oracle Address.
   *
   * @type {State<PublicKey>}
   */
  @state(PublicKey) oracleAddress = State<PublicKey>(); // State variable storing the Oracle's address
  /**
   * Represents the token address stored in the state.
   *
   * @type {State<PublicKey>}
   */
  @state(PublicKey) tokenAddress = State<PublicKey>(); // State variable storing the Token's address
  /**
   * Represents the initial state of a field in a data structure.
   *
   * @type {State<Field>}
   */
  @state(Field) data0 = State<Field>();

  /**
   * Initializes the instance.
   *
   * This method initializes the instance by calling the 'init' method of the super class, and
   * setting the value of 'this.data0' to 'Field(0)'.
   *
   * @returns {void}
   */
  init(): void {
    super.init();
    // this.oracleAddress.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY)); // Initialize with provided Oracle address

    this.data0.set(Field(0));
  }

  /**
   * Sets the stored Oracle contract address.
   *
   * @param {PublicKey} oracleAddress - The new Oracle contract address to set.
   * @returns {Bool} - A boolean indicating success (always true in this implementation).
   */
  @method setOracleContract(oracleAddress: PublicKey): Bool {
    this.oracleAddress.set(oracleAddress);
    return Bool(true);
  }

  /**
   * Updates the stored ERC-677 token address associated with this client.
   *
   * @param {PublicKey} tokenAddress - The new PublicKey of the ERC-677 token.
   * @return {Bool} - True to indicate successful execution.
   */
  @method setErc677Token(tokenAddress: PublicKey): Bool {
    this.tokenAddress.set(tokenAddress);
    return Bool(true);
  }

  /**
   * Sends an Oracle request to the stored Oracle contract.
   *
   * @param {PublicKey} oracleAddress - The new Oracle contract address to set.
   * @param {Field} req0 - The first field of the request data.
   * @param {Field} req1 - The second field of the request data.
   * @param {Field} req2 - The third field of the request data.
   * @param {Field} req3 - The fourth field of the request data.
   * @returns {Bool} - A boolean indicating success (determined by the Oracle contract).
   */
  @method sendOracleRequestWithAddr(
    oracleAddress: PublicKey,
    req0: Field,
    req1: Field,
    req2: Field,
    req3: Field
  ): Bool {
    // const oraclePublicKey = this.oraclePublicKey.get();
    // this.oraclePublicKey.assertEquals(oraclePublicKey);

    const oracleContract = new OracleContract(oracleAddress); // Instantiate Oracle contract
    return oracleContract.oracleRequest(req0, req1, req2, req3); // Forward request to Oracle
  }

  /**
   * Sends an Oracle request to the stored Oracle contract.
   *
   * @param {Field} req0 - The first field of the request data.
   * @param {Field} req1 - The second field of the request data.
   * @param {Field} req2 - The third field of the request data.
   * @param {Field} req3 - The fourth field of the request data.
   * @returns {Bool} - A boolean indicating success (determined by the Oracle contract).
   */
  @method sendOracleRequest(
    req0: Field,
    req1: Field,
    req2: Field,
    req3: Field
  ): Bool {
    const oraclePublicKey = this.oracleAddress.get();
    this.oracleAddress.requireEquals(this.oracleAddress.get());

    const oracleContract = new OracleContract(oraclePublicKey); // Instantiate Oracle contract
    return oracleContract.oracleRequest(req0, req1, req2, req3); // Forward request to Oracle
  }

  /**
   * Sends an ERC677 request to the Oracle contract.
   *
   * @param {Field} req0 - The first field of the request.
   * @param {Field} req1 - The second field of the request.
   * @param {Field} req2 - The third field of the request.
   * @param {Field} req3 - The fourth field of the request.
   *
   * @return {Bool} - Returns true if the request was successfully sent to the Oracle contract.
   */
  @method sendErc677RequestTo(
    req0: Field,
    req1: Field,
    req2: Field,
    req3: Field
  ): Bool {
    const tokenAddressPublicKey = this.tokenAddress.get();
    this.tokenAddress.requireEquals(this.tokenAddress.get());

    const oracleAddressPublicKey = this.oracleAddress.get();
    this.oracleAddress.requireEquals(this.oracleAddress.get());

    const tokenContract = new SErc677Contract(tokenAddressPublicKey);

    tokenContract.transferAndCall(
      oracleAddressPublicKey,
      UInt64.from(100_000),
      req0,
      req1,
      req2,
      req3
    );

    return Bool(true);
  }

  /**
   * Callback method for fulfilling an Oracle request.
   *
   * @param {Field} data0 - The data to fulfill the request with.
   * @returns {Bool} A boolean indicating success (always true in this implementation, potentially requiring verification).
   */
  @method onFulfillRequest(data0: Field): Bool {
    // verify from oracleContract
    this.data0.set(data0);

    return Bool(true);
  }
}

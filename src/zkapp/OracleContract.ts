import {
  AccountUpdate,
  Bool,
  Experimental,
  Field,
  ProvablePure,
  PublicKey,
  Signature,
  SmartContract,
  State,
  UInt64,
  method,
  provablePure,
  state,
} from 'o1js';
import { BasicRequestClient } from './BasicRequestClient.js';

/**
 * Abstract class representing an Oracle client.
 */
export abstract class IOracleClient {
  oracleAddress = State<PublicKey>(); // State variable storing the Oracle's address
  tokenAddress = State<PublicKey>(); // State variable storing the Token's address
  data0 = State<Field>();

  /**
   * Sets the Oracle contract address.
   *
   * @param oracleAddress - The public key of the Oracle contract.
   * @returns A boolean indicating success.
   */
  abstract setOracleContract(oracleAddress: PublicKey): Bool;
  /**
   * Updates the stored ERC-677 token address associated with this oracle contract.
   *
   * @param tokenAddress - The new PublicKey of the ERC-677 token.
   * @returns True to indicate successful execution.
   */
  abstract setErc677Token(tokenAddress: PublicKey): Bool;

  /**
   * Sends an Oracle request.
   *
   * @param oracleAddress - The public key of the Oracle contract.
   * @param req0 - The first field of the request data.
   * @param req1 - The second field of the request data.
   * @param req2 - The third field of the request data.
   * @param req3 - The fourth field of the request data.
   * @returns A boolean indicating success.
   */
  abstract sendOracleRequestWithAddr(
    oracleAddress: PublicKey,
    req0: Field,
    req1: Field,
    req2: Field,
    req3: Field
  ): Bool;

  abstract sendOracleRequest(
    req0: Field,
    req1: Field,
    req2: Field,
    req3: Field
  ): Bool;
  /**
   * Handles the fulfillment of an Oracle request.
   *
   * @param data0 - The data0 data from the Oracle.
   * @returns A boolean indicating success.
   */
  abstract onFulfillRequest(data0: Field): Bool;
}

/**
 * Represents the data structure for an Oracle request.
 */
export interface IOracleData {
  /**
   * The public key of the sender who initiated the Oracle request.
   */
  sender: string; // Consider using PublicKey type if available

  /**
   * The first field of the request data (converted to string).
   */
  req0: string;

  /**
   * The second field of the request data (converted to string).
   */
  req1: string;

  /**
   * The third field of the request data (converted to string).
   */
  req2: string;

  /**
   * The fourth field of the request data (converted to string).
   */
  req3: string;
}

/**
 * Abstract class representing an Oracle contract.
 */
export abstract class IOracleContract {
  tokenAddress = State<PublicKey>(); // State variable storing the Token's address

  /**
   * Makes an Oracle request.
   *
   * @param req0 - The first field of the request data.
   * @param req1 - The second field of the request data.
   * @param req2 - The third field of the request data.
   * @param req3 - The fourth field of the request data.
   * @returns A boolean indicating success.
   */
  abstract oracleRequest(
    req0: Field,
    req1: Field,
    req2: Field,
    req3: Field
  ): Bool;

  /**
   * Fulfills an Oracle request, verifies a signature, and potentially sends a callback to the specified address.
   *
   * @param callbackAddress - The public key of the contract to send the callback to (optional).
   * @param data0 - The first field of the data to be sent in the callback (optional).
   * @param signature - The signature to be verified (associated with the request or data).
   * @returns A boolean indicating success (always true in this implementation, potentially modify based on requirements).
   */
  abstract fulfillOracleRequest(
    callbackAddress: PublicKey,
    data0: Field,
    signature: Signature
  ): Bool;

  /**
   * Events emitted by the Oracle contract.
   */
  events: IOracleEvents;
}
/**
 * Type representing the events emitted by an Oracle contract.
 */
export type IOracleEvents = {
  /**
   * Event emitted when an Oracle request is made.
   */
  OracleRequest: ProvablePure<{
    /**
     * Event emitted when an Oracle request is made.
     */
    sender: PublicKey;
    /**
     * The first field of the request data.
     */
    req0: Field;
    /**
     * The second field of the request data.
     */
    req1: Field;
    /**
     * The third field of the request data.
     */
    req2: Field;
    /**
     * The fourth field of the request data.
     */
    req3: Field;
  }>;
};

/**
 * Represents events emitted by the Oracle contract.
 */
export const OracleEvents: IOracleEvents = {
  /**
   * Event emitted when an Oracle request is made.
   */
  OracleRequest: provablePure({
    /**
     * The public key of the sender.
     */
    sender: PublicKey,
    /**
     * The first field of the request data.
     */
    req0: Field,
    /**
     * The second field of the request data.
     */
    req1: Field,
    /**
     * The third field of the request data.
     */
    req2: Field,
    /**
     * The fourth field of the request data.
     */
    req3: Field,
  }),
};

/**
 * An Oracle contract implementing the `IOracleContract` interface.
 */
export class OracleContract extends SmartContract implements IOracleContract {
  /**
   * Stores the address of a token associated with the oracle contract. This
   * token might be used for payment of oracle services or other interactions.
   */
  @state(PublicKey) tokenAddress = State<PublicKey>();

  init() {
    super.init();
  }

  /**
   * Updates the stored ERC-677 token address associated with this oracle contract.
   *
   * @param tokenAddress - The new PublicKey of the ERC-677 token.
   * @returns True to indicate successful execution.
   */
  @method setErc677Token(tokenAddress: PublicKey): Bool {
    this.tokenAddress.set(tokenAddress);
    return Bool(true);
  }

  /**
   * Makes an Oracle request based on provided data.
   *
   * @param req0 - The first field of the request data.
   * @param req1 - The second field of the request data.
   * @param req2 - The third field of the request data.
   * @param req3 - The fourth field of the request data.
   * @returns A boolean indicating success (always true in this implementation).
   */
  @method
  oracleRequest(req0: Field, req1: Field, req2: Field, req3: Field): Bool {
    // Publish Event for Operator

    // Assert Erc677Token from Sender
    // ? CallbackAddr
    // const validSignature = signature.verify(tokenAddress, [roundId]);

    this.emitEvent('OracleRequest', {
      sender: this.sender,
      req0,
      req1,
      req2,
      req3,
    });

    return Bool(true); // Always return true, potentially modify based on requirements
  }

  /**
   * Fulfills an Oracle request, verifies a signature, and potentially sends a callback to the specified address.
   *
   * @param callbackAddress - The public key of the contract to send the callback to (optional).
   * @param data0 - The first field of the data to be sent in the callback (optional).
   * @param signature - The signature to be verified (associated with the request or data).
   * @returns A boolean indicating success (always true in this implementation, potentially modify based on requirements).
   */
  @method
  fulfillOracleRequest(
    callbackAddress: PublicKey,
    data0: Field,
    signature: Signature
  ): Bool {
    const validSignature = signature.verify(this.address, [data0]);
    validSignature.assertTrue();

    const callbackContract = new BasicRequestClient(callbackAddress);
    callbackContract.onFulfillRequest(data0);

    return Bool(true); // Always return true, potentially modify based on requirements
  }

  // ⬜ cancelOracleRequest - Allows requesters to cancel requests.
  // ⬜ setFulfillmentPermission() - Sets the fulfillment permission for a given operator.
  // function setFulfillmentPermission(address _node, bool _allowed)

  // ⬜ getAuthorizationStatus() - Use this to check if an operator is authorized for fulfilling requests.
  // function getAuthorizationStatus(address _node)

  // ⬜ withdraw() - Allows the operator to withdraw earned.
  // function withdraw(address _recipient, uint256 _amount)

  /**
   * Events emitted by this Oracle contract.
   */
  events = OracleEvents;
}

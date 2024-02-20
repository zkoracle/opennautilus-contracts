import {
  AccountUpdate,
  Bool,
  Experimental,
  Field,
  ProvablePure,
  PublicKey,
  SmartContract,
  State,
  UInt64,
  method,
  provablePure,
} from 'o1js';

/**
 * Abstract class representing an Oracle client.
 */
export abstract class IOracleClient {
  /**
   * Sets the Oracle contract address.
   *
   * @param oracleAddress - The public key of the Oracle contract.
   * @returns A boolean indicating success.
   */
  abstract setOracleContract(oracleAddress: PublicKey): Bool;
  /**
   * Sends an Oracle request.
   *
   * @param req0 - The first field of the request data.
   * @param req1 - The second field of the request data.
   * @param req2 - The third field of the request data.
   * @param req3 - The fourth field of the request data.
   * @returns A boolean indicating success.
   */
  abstract sendOracleRequest(
    req0: Field,
    req1: Field,
    req2: Field,
    req3: Field
  ): Bool;
  /**
   * Handles the fulfillment of an Oracle request.
   *
   * @param reply - The reply data from the Oracle.
   * @returns A boolean indicating success.
   */
  abstract onFulfillRequest(reply: Field): Bool;
}

/**
 * Abstract class representing an Oracle contract.
 */
export abstract class IOracleContract {
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
  init() {
    super.init();
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

    this.emitEvent('OracleRequest', {
      sender: this.sender,
      req0,
      req1,
      req2,
      req3,
    });

    return Bool(true); // Always return true, potentially modify based on requirements
  }

  // TODO
  // ⬜ fulfillOracleRequest() - Called by the operator to fulfill requests.
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

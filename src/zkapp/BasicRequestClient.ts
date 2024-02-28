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
} from 'o1js';
import { OracleContract, IOracleClient } from './OracleContract.js';
import { OracleRequest } from '../gen/oracle-request_pb';

/**
 * Builds a Mina transaction that sends an Oracle request to a designated zkApp.
 *
 * @param sender - The public key of the sender.
 * @param zkApp - The zkApp contract that accepts Oracle requests, also implementing the `IOracleClient` interface.
 * @param oracleRequest - The data for the Oracle request, represented as an `OracleRequest` object.
 * @returns A promise that resolves to a Mina transaction containing the Oracle request.
 */
export async function buildOracleRequestTx(
  sender: PublicKey,
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
 * Builds a basic request client contract that can interact with an Oracle.
 *
 * @param address - The public key of the contract to be created.
 * @param oracleAddress - The public key of the Oracle contract to interact with.
 * @returns A promise that resolves to a newly constructed `BasicRequestClient` contract.
 */
export async function buildBasicRequestClient(
  address: PublicKey,
  oracleAddress: PublicKey
): Promise<SmartContract & IOracleClient> {
  /**
   * A basic request client contract that implements the `IOracleClient` interface.
   */
  class BasicRequestClient extends SmartContract implements IOracleClient {
    @state(PublicKey) oracleAddress = State<PublicKey>(); // State variable storing the Oracle's address

    init() {
      super.init();
      this.oracleAddress.set(oracleAddress); // Initialize with provided Oracle address
    }

    /**
     * Sets the stored Oracle contract address.
     *
     * @param oracleAddress - The new Oracle contract address to set.
     * @returns A boolean indicating success (always true in this implementation).
     */
    @method setOracleContract(oracleAddress: PublicKey): Bool {
      this.oracleAddress.requireEquals(oracleAddress);
      this.oracleAddress.set(oracleAddress);

      return Bool(true);
    }

    /**
     * Sends an Oracle request to the stored Oracle contract.
     *
     * @param req0 - The first field of the request data.
     * @param req1 - The second field of the request data.
     * @param req2 - The third field of the request data.
     * @param req3 - The fourth field of the request data.
     * @returns A boolean indicating success (determined by the Oracle contract).
     */
    @method sendOracleRequest(
      req0: Field,
      req1: Field,
      req2: Field,
      req3: Field
    ): Bool {
      const oracleContract = new OracleContract(oracleAddress); // Instantiate Oracle contract
      return oracleContract.oracleRequest(req0, req1, req2, req3); // Forward request to Oracle
    }

    /**
     * Callback method for fulfilling an Oracle request.
     *
     * @param reply - The reply data from the Oracle.
     * @returns A boolean indicating success (always true in this implementation, potentially requiring verification).
     */
    @method onFulfillRequest(data0: Field): Bool {
      // verify from oracleContract

      return Bool(true);
    }
  }

  await BasicRequestClient.compile(); // Compile the contract

  return new BasicRequestClient(address); // Create and return a new instance
}

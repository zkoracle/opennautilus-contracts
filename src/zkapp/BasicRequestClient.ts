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
import { OracleRequest } from '../gen/oracle-request_pb.js';
import { buildERC677Contract } from '../token/Erc677Token.js';

/**
 * Builds a Mina transaction that sends an Oracle request to a designated zkApp with Addr.
 *
 * @param sender - The fee payer specification for the transaction.
 * @param oracleAddress - The Oracle contract address to use.
 * @param zkApp - The zkApp contract that accepts Oracle requests, also implementing the `IOracleClient` interface.
 * @param oracleRequest - The data for the Oracle request, represented as an `OracleRequest` object.
 * @returns A promise that resolves to a Mina transaction containing the Oracle request.
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
 * @param sender - The fee payer specification for the transaction.
 * @param zkApp - The zkApp contract that accepts Oracle requests, also implementing the `IOracleClient` interface.
 * @param oracleRequest - The data for the Oracle request, represented as an `OracleRequest` object.
 * @returns A promise that resolves to a Mina transaction containing the Oracle request.
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

export async function buildTransferAndCallTx(
  sender: Mina.FeePayerSpec,
  zkApp: SmartContract & IOracleClient,
  oracleRequest: OracleRequest
): Promise<Mina.Transaction> {
  const offChainBytes = oracleRequest.toBinary(); // Convert request data to binary
  const reqField = Encoding.bytesToFields(offChainBytes); // Convert binary to fields

  return Mina.transaction(sender, () => {
    // zkApp.sendErc677RequestTo(reqField[0], reqField[1], reqField[2], reqField[3]);
  });
}


/**
 * A basic request client contract that implements the `IOracleClient` interface.
 */
export class BasicRequestClient extends SmartContract implements IOracleClient {

  @state(PublicKey) oracleAddress = State<PublicKey>(); // State variable storing the Oracle's address
  @state(PublicKey) tokenAddress = State<PublicKey>(); // State variable storing the Token's address
  @state(Field) data0 = State<Field>();

  init() {
    super.init();
    // this.oracleAddress.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY)); // Initialize with provided Oracle address

    this.data0.set(Field(0));
  }

  /**
   * Sets the stored Oracle contract address.
   *
   * @param oracleAddress - The new Oracle contract address to set.
   * @returns A boolean indicating success (always true in this implementation).
   */
  @method setOracleContract(oracleAddress: PublicKey): Bool {
    this.oracleAddress.set(oracleAddress);
    return Bool(true);
  }

  /**
   * Updates the stored ERC-677 token address associated with this client.
   *
   * @param tokenAddress - The new PublicKey of the ERC-677 token.
   * @returns True to indicate successful execution.
   */
  @method setErc677Token(tokenAddress: PublicKey): Bool {
    this.tokenAddress.set(tokenAddress);
    return Bool(true);
  }

  /**
   * Sends an Oracle request to the stored Oracle contract.
   *
   * @param oracleAddress - The new Oracle contract address to set.
   * @param req0 - The first field of the request data.
   * @param req1 - The second field of the request data.
   * @param req2 - The third field of the request data.
   * @param req3 - The fourth field of the request data.
   * @returns A boolean indicating success (determined by the Oracle contract).
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
    const oraclePublicKey = this.oracleAddress.get();
    this.oracleAddress.requireEquals(this.oracleAddress.get());

    const oracleContract = new OracleContract(oraclePublicKey); // Instantiate Oracle contract
    return oracleContract.oracleRequest(req0, req1, req2, req3); // Forward request to Oracle
  }

  /**
   * Sends an Erc677 TransferAndCall request to the stored Oracle contract.
   *
   * @param req0 - The first field of the request data.
   * @param req1 - The second field of the request data.
   * @param req2 - The third field of the request data.
   * @param req3 - The fourth field of the request data.
   * @returns A boolean indicating success (determined by the Oracle contract).
   */
  @method sendErc677RequestTo(req0: Field, req1: Field, req2: Field, req3: Field): Bool {
    const tokenAddressPublicKey = this.tokenAddress.get();
    this.tokenAddress.requireEquals(this.tokenAddress.get());

    // const oracleContract =  buildERC677Contract(oraclePublicKey, "","",9); // Instantiate Oracle contract
    // return oracleContract.oracleRequest(req0, req1, req2, req3); // Forward request to Oracle
  
    return Bool(true);
  }

  /**
   * Callback method for fulfilling an Oracle request.
   *
   * @param reply - The reply data from the Oracle.
   * @returns A boolean indicating success (always true in this implementation, potentially requiring verification).
   */
  @method onFulfillRequest(data0: Field): Bool {
    // verify from oracleContract
    this.data0.set(data0);

    return Bool(true);
  }
}

# ClientContract: Building and Parsing Oracle Requests

This document explains the components of the ClientContract, focusing on how it builds Oracle requests in Protobuf format and encodes them for transaction submission, as well as how to parse those requests from the on-chain state.

## Building the Request

```typescript
let req1 = new OracleRequest({
  protocol: 'http',
  method: 'get',
  url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD',
  path: 'RAW.ETH.USD.PRICE',
});

// req1.toBinary() converts the OracleRequest into a binary format suitable for encoding.
const offChainBytes = req1.toBinary();
// Encoding.bytesToFields(offChainBytes) splits the binary data into separate fields. These fields presumably represent different aspects of the request data.
const ReqField = Encoding.bytesToFields(offChainBytes);

let tx = await Mina.transaction(player1, () => {
  zkApp.request(ReqField[0], ReqField[1], ReqField[2], ReqField[3]);
});
```

## Parsing the Request (OnChain)

```typescript
const onChainReq = [
  zkApp.req0.get(),
  zkApp.req1.get(),
  zkApp.req2.get(),
  zkApp.req3.get(),
];

expect(ReqField).toEqual(onChainReq);

// Encoding.bytesFromFields(onChainReq) combines the on-chain data back into its original binary format.
const onChainBytes = Encoding.bytesFromFields(onChainReq);
// OracleRequest.fromBinary(onChainBytes) builds a new OracleRequest object from the reconstructed binary data.
const req2 = OracleRequest.fromBinary(onChainBytes);
```

# Summary

This code demonstrates how the ClientContract interacts with the Mina blockchain to perform off-chain computations and store relevant data on-chain securely. Building requests with Protobuf and encoding them ensures efficient data handling, while parsing from the on-chain state allows verification and further processing.

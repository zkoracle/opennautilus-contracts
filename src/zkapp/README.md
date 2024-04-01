# @zkoracle/opennautilus-contracts

This repository houses the opennautilus contracts.

## Testing

The folder contains various test scripts to ensure the reliable functionality of the developed contracts. In the `/src/zkapp` directory, `BasicRequestClient.test.ts` is one of these test scripts.

When you run the test, using the following command:

```
> @zkoracle/opennautilus-contracts@0.6.7 test
> node --experimental-vm-modules node_modules/jest/bin/jest.js src/zkapp/BasicRequestClient.test.ts

(node:13296) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
  console.log
    request https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD
           - offchain-value 'RAW.ETH.USD.PRICE' = 3583.3682
           - onchain-value 'RAW.ETH.USD.PRICE' = 3583.3682

      at Object.<anonymous> (src/zkapp/BasicRequestClient.test.ts:237:15)

  console.log
    request https://min-api.cryptocompare.com/data/pricemultifull?fsyms=MINA&tsyms=USD
          - offchain-value 'RAW.MINA.USD.PRICE' = 1.266
          - onchain-value 'RAW.MINA.USD.PRICE' = 1.266

      at Object.<anonymous> (src/zkapp/BasicRequestClient.test.ts:331:15)

  console.log
    events on B62qjjB3j3swws37jpG9VJwAcmZik3nz76ujhGEFhRsgTYrh7Gkc3Fp [
      {
        type: 'OracleRequest',
        data: '{
        "data":{
            "sender":"B62qjiwcwBEMqWpCVVB77Kx6PVYYBCXQNkbwU8NXzV3AhUEAoKZeS5Q",
            "req0":"202105089534635679287542102129634014098290637890342538615278857583122187274",
            "req1":"186322468418739161443975675705270205917780742321009757922220809732710756473",
            "req2":"116931739001745108717231896226221161100743325388707523738563652938808194406",
            "req3":"100663972473015221515207983956"},
            "transactionInfo":{}}'
      }
    ]

      at Function.displayEvents (src/Toolkit:203:13)

  console.log
    request https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC&tsyms=USD
          - offchain-value 'RAW.BTC.USD.PRICE' = 70826.0073
          - onchain-value 'RAW.BTC.USD.PRICE' = 70826.0073

      at Object.<anonymous> (src/zkapp/BasicRequestClient.test.ts:446:15)

 PASS  src/zkapp/BasicRequestClient.test.ts (271.183 s)
  BasicRequestClient SmartContract
    Send BasicRequest to 'OracleRequest()'
      ✓ should got oracleRequestWithAddr event from on-chain tx, then fetch ETH price and fulfillOracle (79297 ms)
      ✓ should got oracleRequest event from on-chain tx, then fetch MINA price and fulfillOracle (83078 ms)
    Send TransferAndCall to 'OracleRequest()'
      ✓ should got oracleRequest event from on-chain tx, then fetch BTC price and fulfillOracle (98386 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        271.23 s

```

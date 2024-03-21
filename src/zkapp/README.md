# @zkoracle/opennautilus-contracts
This repository houses the opennautilus contracts.

## Testing
The folder contains various test scripts to ensure the reliable functionality of the developed contracts. In the `/src/zkapp` directory, `BasicRequestClient.test.ts` is one of these test scripts.

When you run the test, using the following command: 

```
> @zkoracle/opennautilus-contracts@0.6.6 test /Users/warun/HackathonProjects/opennautilus-contacts
> node --experimental-vm-modules node_modules/jest/bin/jest.js "src/zkapp/BasicRequestClient.test.ts"

(node:16221) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
  console.log
    request https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD
           - offchain-value 'RAW.ETH.USD.PRICE' = 3462.0558
           - onchain-value 'RAW.ETH.USD.PRICE' = 3462.0558

      at Object.<anonymous> (src/zkapp/BasicRequestClient.test.ts:199:15)

  console.log
    request https://min-api.cryptocompare.com/data/pricemultifull?fsyms=MINA&tsyms=USD
          - offchain-value 'RAW.MINA.USD.PRICE' = 1.343
          - onchain-value 'RAW.MINA.USD.PRICE' = 1.343

      at Object.<anonymous> (src/zkapp/BasicRequestClient.test.ts:297:15)

 PASS  src/zkapp/BasicRequestClient.test.ts (148.215 s)
  BasicRequestClient SmartContract
    Send BasicRequest to 'OracleRequest()'
      ✓ should got oracleRequestWithAddr event from on-chain tx, then fetch ETH price and fulfillOracle (68650 ms)
      ✓ should got oracleRequest event from on-chain tx, then fetch MINA price and fulfillOracle (73353 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        148.251 s

```

### buildBasicTokenContract(address, symbol): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<SmartContract & IBasicTokenContract>

Creates a basic token contract instance.

| Parameter | Type                                                                                              | Optional | Description                                     |
| --------- | ------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| address   | PublicKey                                                                                         | ❌       | The address where the contract will be deployed |
| symbol    | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       | The symbol for the token (e.g., "MYTOKEN")      |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/BasicTokenContract.ts#L83)

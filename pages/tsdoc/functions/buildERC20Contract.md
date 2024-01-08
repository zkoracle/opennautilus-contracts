### buildERC20Contract(address, name, symbol, decimals): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<SmartContract & IERC20>

Constructs and deploys an ERC20 token contract.

```typescript
const myToken = await buildERC20Contract(address, 'MyToken', 'MTK', 18);
// Interact with the token contract using the `myToken` instance
```

| Parameter | Type                                                                                              | Optional | Description                                             |
| --------- | ------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------- |
| address   | PublicKey                                                                                         | ❌       | The address of the token contract on the blockchain.    |
| name      | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       | The name of the token.                                  |
| symbol    | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       | The symbol of the token.                                |
| decimals  | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | ❌       | The number of decimals used to represent token amounts. |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L152)

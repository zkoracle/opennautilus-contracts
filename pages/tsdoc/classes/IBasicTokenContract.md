## IBasicTokenContract

Defines the basic interface for a token contract.

All token contracts should inherit from this class and implement its methods.

```typescript
new IBasicTokenContract();
```

## Methods

### public deploy(): [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)

Deploys the token contract to the blockchain.

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/BasicTokenContract.ts#L31)

### public init(): [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)

Initializes the token contract after deployment.

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/BasicTokenContract.ts#L40)

### public mint(receiverAddress, amount, adminSignature): [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)

Mints new tokens and assigns them to a receiver.

| Parameter       | Type      | Optional | Description                                                                   |
| --------------- | --------- | -------- | ----------------------------------------------------------------------------- |
| receiverAddress | PublicKey | ❌       | The address of the receiver who will receive the newly minted tokens          |
| amount          | UInt64    | ❌       | The amount of tokens to mint                                                  |
| adminSignature  | Signature | ❌       | A signature from an authorized administrator, required to approve the minting |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/BasicTokenContract.ts#L49)

### public sendTokens(senderAddress, receiverAddress, amount): [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)

Sends tokens from one address to another.

| Parameter       | Type      | Optional | Description                                              |
| --------------- | --------- | -------- | -------------------------------------------------------- |
| senderAddress   | PublicKey | ❌       | The address of the sender who is transferring the tokens |
| receiverAddress | PublicKey | ❌       | The address of the receiver who will receive the tokens  |
| amount          | UInt64    | ❌       | The amount of tokens to transfer                         |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/BasicTokenContract.ts#L62)

## IERC20

Represents a standard interface for fungible tokens, implementing the ERC20 standard.

```typescript
new IERC20();
```

## Properties

### public decimals: any

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L54)

### public events: any

Events emitted by the contract.

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L111)

### public name: any

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L43)

### public symbol: any

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L48)

## Methods

### public allowance(owner, spender): UInt64

| Parameter | Type      | Optional | Description                     |
| --------- | --------- | -------- | ------------------------------- |
| owner     | PublicKey | ❌       | The address of the token owner. |
| spender   | PublicKey | ❌       | The address of the spender.     |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L69)

### public approveSpend(spender, value): Bool

| Parameter | Type      | Optional | Description                          |
| --------- | --------- | -------- | ------------------------------------ |
| spender   | PublicKey | ❌       | The address to approve as a spender. |
| value     | UInt64    | ❌       | The amount of tokens to approve.     |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L106)

### public balanceOf(owner): UInt64

| Parameter | Type      | Optional | Description                     |
| --------- | --------- | -------- | ------------------------------- |
| owner     | PublicKey | ❌       | The address of the token owner. |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L63)

### public totalSupply(): UInt64

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L58)

### public transfer(to, value): Bool

| Parameter | Type      | Optional | Description                        |
| --------- | --------- | -------- | ---------------------------------- |
| to        | PublicKey | ❌       | The address to transfer tokens to. |
| value     | UInt64    | ❌       | The amount of tokens to transfer.  |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L81)

### public transferFrom(from, to, value): Bool

| Parameter | Type      | Optional | Description                          |
| --------- | --------- | -------- | ------------------------------------ |
| from      | PublicKey | ❌       | The address to transfer tokens from. |
| to        | PublicKey | ❌       | The address to transfer tokens to.   |
| value     | UInt64    | ❌       | The amount of tokens to transfer.    |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Erc20Token.ts#L94)

## Toolkit

```typescript
new Toolkit();
```

## Methods

### public Toolkit(): [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L12)

### public static deploy(config, feePayerKey, zkAppKey, zkApp, tag): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)>

| Parameter   | Type                                                                                              | Optional |
| ----------- | ------------------------------------------------------------------------------------------------- | -------- |
| config      | any                                                                                               | ❌       |
| feePayerKey | PrivateKey                                                                                        | ❌       |
| zkAppKey    | PrivateKey                                                                                        | ❌       |
| zkApp       | SmartContract                                                                                     | ❌       |
| tag         | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L196)

### public static getTxnUrl(graphQlUrl, txnHash): [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

| Parameter  | Type                                                                                                       | Optional |
| ---------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| graphQlUrl | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)          | ❌       |
| txnHash    | undefined[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L14)

### public static initialFeePayer(fs, network): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<\{ privateKey: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String); publicKey: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String); }>

| Parameter | Type                                                                                              | Optional |
| --------- | ------------------------------------------------------------------------------------------------- | -------- |
| fs        | any                                                                                               | ❌       |
| network   | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L77)

### public static initialKey(fs, path, tag): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<\{ privateKey: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String); publicKey: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String); }>

| Parameter | Type                                                                                              | Optional |
| --------- | ------------------------------------------------------------------------------------------------- | -------- |
| fs        | any                                                                                               | ❌       |
| path      | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |
| tag       | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L175)

### public static initialKeyPairFromLightnet(fs, path): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<\{ privateKey: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String); publicKey: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String); }>

| Parameter | Type                                                                                              | Optional |
| --------- | ------------------------------------------------------------------------------------------------- | -------- |
| fs        | any                                                                                               | ❌       |
| path      | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L158)

### public static initialPlayers(fs, network): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<\{ pk1: PrivateKey; pk2: PrivateKey; }>

| Parameter | Type                                                                                              | Optional |
| --------- | ------------------------------------------------------------------------------------------------- | -------- |
| fs        | any                                                                                               | ❌       |
| network   | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L110)

### public static initialZkAppKey(fs, path): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<\{ privateKey: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String); publicKey: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String); }>

| Parameter | Type                                                                                              | Optional |
| --------- | ------------------------------------------------------------------------------------------------- | -------- |
| fs        | any                                                                                               | ❌       |
| path      | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L192)

### public static isFileExists(fs, f): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)>

| Parameter | Type                                                                                              | Optional |
| --------- | ------------------------------------------------------------------------------------------------- | -------- |
| fs        | any                                                                                               | ❌       |
| f         | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L68)

### public static processTx(config, sentTx, keys, tag): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)>

| Parameter | Type                                                                                                         | Optional |
| --------- | ------------------------------------------------------------------------------------------------------------ | -------- |
| config    | any                                                                                                          | ❌       |
| sentTx    | Transaction                                                                                                  | ❌       |
| keys      | [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\<PrivateKey> | ❌       |
| tag       | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)            | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L29)

### public static storePrivateKey(fs, path, key): [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)>

| Parameter | Type                                                                                              | Optional |
| --------- | ------------------------------------------------------------------------------------------------- | -------- |
| fs        | any                                                                                               | ❌       |
| path      | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ❌       |
| key       | PrivateKey                                                                                        | ❌       |

- [Source](https://github.com/zkoracle/opennautilus-contacts/blob/bd62210/src/Toolkit.ts#L144)

# Eternal Shards

## Contracts

- [`Shard.cdc`](./cadence/contracts/Shard.cdc) - The Shard NFT
- [`Crystal.cdc`](./cadence/contracts/Crystal.cdc) - The Crystal mechanics

## Development Testing

### Dependencies

- Yarn or NPM
- [`flow-cli`](https://docs.onflow.org/flow-cli/install/)

### Running

- Install dependencies

```bash
yarn # or npm i
```

- Initialize Flow

```bash
flow init
```

- Run the test suite

```bash
yarn test
```

# Shards Deployer

## Deploy the Shards contract to testnet

Update the `flow.json` with your account keys using the steps found [here](https://docs.onflow.org/dapp-development/testnet-deployment/#creating-an-account)

```
flow project deploy --network testnet
```

## Running

- Create `.env` file with the following contents, replacing your testnet account address, keys, and the Shard address from the previous step

```bash
FLOW_ACCOUNT_ADDRESS=4fcbf393977f9976
FLOW_ACCOUNT_PRIVATE_KEY=0ee5f8cd60227c75e0148c8039121c997efa18177f9a69dbec4f3b8a8abb9b6b
FLOW_NFT_ADDRESS=0x631e88ae7f1d7c20
FLOW_SHARD_ADDRESS=0x4fcbf393977f9976
SKIP_PREFLIGHT_CHECK=true
```

- Run the web app

```bash
yarn start
```

## Reset the contract (for testing purposes)

**Click the "Reset Contract" button in the web app FIRST**

Then run:

```
flow accounts remove-contract Shard --network testnet --signer testnet-account
```

# nft-sample-collection

A simple smart contract for the usual NFT collections.

On the smart contract constructor you can specify the `maxSupply` of tokens, the `baseTokenUri` and the `mintPrice`.

The mint function is a payable function that transfers the funds to the contract itself, to avoid reentrancy bugs. Only the deployer of the smart contract can withdraw said funds.

## Scripts

We are using scripts for the different tasks on this repo.

```shell
# setup the project dependencies
bin/setup

# compile and build the project
bin/build

# run the tests
bin/test

# lint solidity code
bin/lint

# deploy to hardhat's network
bin/deploy

# deploy to another network (provided it's configured)
bin/deploy rinkeby
```

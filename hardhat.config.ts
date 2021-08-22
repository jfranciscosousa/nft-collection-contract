import { task } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const { MNEMONIC, INFURA_API_KEY, ETHERSCAN_API_KEY } = process.env;

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

function createTestnetConfig(
  network: keyof typeof chainIds
): NetworkUserConfig {
  const url = `https://${network}.infura.io/v3/${INFURA_API_KEY}`;

  return {
    accounts: [`0x${MNEMONIC}`],
    chainId: chainIds[network],
    url,
  };
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      blockGasLimit: 10000000,
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
    },
    rinkeby: createTestnetConfig("rinkeby"),
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};

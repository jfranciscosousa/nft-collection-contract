import { parseEther } from "@ethersproject/units";
import hre from "hardhat";
import { MyToken, MyToken__factory } from "../typechain";

const { MAX_TOKENS, BASE_URI, MINT_PRICE, LAUNCH_DATE } = process.env;

async function main() {
  const MyToken: MyToken__factory = (await hre.ethers.getContractFactory(
    "MyToken"
  )) as MyToken__factory;
  const myToken: MyToken = (await MyToken.deploy(
    MAX_TOKENS as string,
    BASE_URI as string,
    parseEther(MINT_PRICE as string),
    new Date(LAUNCH_DATE as string).getTime() / 1000
  )) as MyToken;

  await myToken.deployed();

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    await hre.run("verify:verify", {
      address: myToken.address,
      constructorArguments: [],
    });
  }

  console.log("MyToken deployed to:", myToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

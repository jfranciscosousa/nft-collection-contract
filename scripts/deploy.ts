import { parseEther } from "@ethersproject/units";
import hre from "hardhat";
import { MyToken, MyToken__factory } from "../typechain";
import dateToBlockchain from "../utils/dateToBlockchain";

const { MAX_TOKENS, BASE_URI, MINT_PRICE, LAUNCH_DATE } = process.env;

async function main() {
  const MyToken: MyToken__factory = (await hre.ethers.getContractFactory(
    "MyToken"
  )) as MyToken__factory;
  console.log("deploying the MyToken contract");

  const myToken: MyToken = (await MyToken.deploy(
    MAX_TOKENS as string,
    BASE_URI as string,
    parseEther(MINT_PRICE as string),
    dateToBlockchain(new Date(LAUNCH_DATE as string))
  )) as MyToken;

  await myToken.deployTransaction.wait(6);

  console.log("token contract deployed to:", myToken.address);

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("verifying the contract on etherscan");

    await hre.run("verify:verify", {
      address: myToken.address,
      constructorArguments: [
        MAX_TOKENS,
        BASE_URI,
        parseEther(MINT_PRICE as string),
        dateToBlockchain(new Date(LAUNCH_DATE as string)),
      ],
    });
  }

  console.log("all done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import hre from "hardhat";

async function main() {
  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();

  await myToken.deployed();

  console.log("MyToken deployed to:", myToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

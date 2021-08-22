import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ContractFactory } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { MyToken } from "../typechain";

const BASE_URI = "https://my-api/tokens/";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("MyToken", function () {
  let owner: SignerWithAddress;
  let other: SignerWithAddress;
  let MyToken: ContractFactory;
  let myToken: MyToken;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = (await MyToken.deploy()) as MyToken;
    await myToken.deployed();
    myToken = myToken.connect(other);
  });

  describe("mint", () => {
    it("should mint an item and transfer to address", async function () {
      const receipt = myToken.mint(owner.address, {
        value: parseEther("0.1"),
      });

      await expect(receipt)
        .to.be.emit(myToken, "Transfer")
        .withArgs(ZERO_ADDRESS, owner.address, 1);
    });

    it("should transfer the payable value to the contract owner", async function () {
      const receipt = myToken.mint(other.address, {
        value: parseEther("0.1"),
      });

      await expect(() => receipt).to.changeEtherBalance(
        owner,
        parseEther("0.1").toString()
      );
      await expect(() => receipt).to.changeEtherBalance(
        other,
        parseEther("-0.1").toString()
      );
    });

    it("increments the tokenId after the first mint", async function () {
      let receipt = myToken.mint(owner.address, {
        value: parseEther("0.1"),
      });

      await expect(receipt)
        .to.be.emit(myToken, "Transfer")
        .withArgs(ZERO_ADDRESS, owner.address, 1);

      receipt = myToken.mint(owner.address, {
        value: parseEther("0.1"),
      });

      await expect(receipt)
        .to.be.emit(myToken, "Transfer")
        .withArgs(ZERO_ADDRESS, owner.address, 2);
    });

    it("only mints up to 100 assets", async function () {
      // mint a hundred assets
      for (let index = 1; index <= 100; index++) {
        await myToken.mint(owner.address, {
          value: parseEther("0.1"),
        });
      }

      // mint asset 101
      const receipt = myToken.mint(other.address, {
        value: parseEther("0.1"),
      });

      await expect(receipt).to.be.revertedWith("max tokens minted");
    });

    it("should revert if users pay less than 0.1 ETH", async function () {
      const receipt = myToken.mint(other.address, {
        value: parseEther("0.09"),
      });

      await expect(receipt).to.be.revertedWith("minting price is 0.1 ether");
    });

    it("should revert if users pay more than 0.1 ETH", async function () {
      const receipt = myToken.mint(owner.address, {
        value: parseEther("0.11"),
      });

      await expect(receipt).to.be.revertedWith("minting price is 0.1 ether");
    });
  });

  describe("tokenURI", () => {
    it("should resolve to our API", async function () {
      await myToken.mint(owner.address, {
        value: parseEther("0.1"),
      });
      const tokenId = (
        await myToken.queryFilter(myToken.filters.Transfer(null, owner.address))
      )[0].args.tokenId;

      expect(await myToken.tokenURI(tokenId)).to.equal(`${BASE_URI}${tokenId}`);
    });
  });
});

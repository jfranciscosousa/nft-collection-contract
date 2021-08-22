import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ContractFactory } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { MyToken } from "../typechain";

const BASE_URI = "https://my-api/tokens/";

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
  });

  describe("mint", () => {
    it("should mint an item and transfer to address", async function () {
      await myToken.mint(owner.address, {
        value: parseEther("0.1"),
      });
      const tokenId = await myToken.lastTokenId();

      expect(await myToken.ownerOf(tokenId)).to.equal(owner.address);
    });

    it("should transfer the payable value to the contract owner", async function () {
      const receipt = myToken.connect(other).mint(other.address, {
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

    it("should revert if users pay less than 0.1 ETH", async function () {
      const receipt = myToken.connect(other).mint(other.address, {
        value: parseEther("0.09"),
      });

      await expect(receipt).to.be.revertedWith("minting price is 0.1 ether");
    });

    it("should revert if users pay more than 0.1 ETH", async function () {
      const receipt = myToken.connect(other).mint(owner.address, {
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
      const tokenId = await myToken.lastTokenId();

      expect(await myToken.tokenURI(tokenId)).to.equal(`${BASE_URI}${tokenId}`);
    });
  });
});

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { add, sub } from "date-fns";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { MyToken, MyToken__factory } from "../typechain";
import dateToBlockchain from "../utils/dateToBlockchain";

const MAX_TOKENS = 100;
const BASE_URI = "https://my-api/tokens/";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MINT_PRICE = parseEther("0.1");
const LAUNCH_DATE = dateToBlockchain(sub(new Date(), { days: 2 }));

describe("MyToken", function () {
  let owner: SignerWithAddress;
  let other: SignerWithAddress;
  let MyToken: MyToken__factory;
  let myToken: MyToken;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    MyToken = (await ethers.getContractFactory("MyToken")) as MyToken__factory;
    myToken = await MyToken.deploy(
      MAX_TOKENS,
      BASE_URI,
      MINT_PRICE,
      LAUNCH_DATE
    );
    await myToken.deployed();
  });

  async function mintAndGetTokenId() {
    await myToken.mint(owner.address, {
      value: parseEther("0.1"),
    });

    const transfers = await myToken.queryFilter(
      myToken.filters.Transfer(null, owner.address)
    );

    return transfers[transfers.length - 1].args.tokenId;
  }

  async function mintMultiple(times: number) {
    const promises = [];

    for (let index = 1; index <= times; index++) {
      promises.push(
        myToken.mint(owner.address, {
          value: parseEther("0.1"),
        })
      );
    }

    await Promise.all(promises);
  }

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
      const receipt = myToken.connect(other).mint(other.address, {
        value: parseEther("0.1"),
      });

      await expect(() => receipt).to.changeEtherBalance(
        myToken,
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

    it("only mints up to MAX_TOKENS", async function () {
      await mintMultiple(MAX_TOKENS);

      // mint asset 101
      const receipt = myToken.mint(other.address, {
        value: parseEther("0.1"),
      });

      await expect(receipt).to.be.revertedWith("max supply minted");
    });

    it("only mints after timestamp", async function () {
      await myToken.setLaunchDate(
        dateToBlockchain(add(new Date(), { days: 2 }))
      );

      const receipt = myToken.mint(owner.address, {
        value: parseEther("0.1"),
      });

      await expect(receipt).to.be.revertedWith(
        "minting not enabled yet, please wait"
      );
    });

    it("should revert if users pay less than 0.1 ETH", async function () {
      const receipt = myToken.mint(other.address, {
        value: parseEther("0.09"),
      });

      await expect(receipt).to.be.revertedWith(
        "minting price is not equal to mintPrice"
      );
      expect(await ethers.provider.getBalance(myToken.address)).to.eq(
        parseEther("0").toString()
      );
    });

    it("should revert if users pay more than 0.1 ETH", async function () {
      const receipt = myToken.mint(owner.address, {
        value: parseEther("0.11"),
      });

      await expect(receipt).to.be.revertedWith(
        "minting price is not equal to mintPrice"
      );
      expect(await ethers.provider.getBalance(myToken.address)).to.eq(
        parseEther("0").toString()
      );
    });
  });

  describe("tokenURI", () => {
    it("should resolve to the defined BASE_URI with tokenId", async function () {
      await myToken.mint(owner.address, {
        value: parseEther("0.1"),
      });
      const tokenId = (
        await myToken.queryFilter(myToken.filters.Transfer(null, owner.address))
      )[0].args.tokenId;

      expect(await myToken.tokenURI(tokenId)).to.equal(`${BASE_URI}${tokenId}`);
    });
  });

  describe("setBaseTokenURI", () => {
    it("should change the baseURI", async function () {
      const tokenId = await mintAndGetTokenId();

      await myToken.setBaseTokenURI("https://test.com/");

      expect(await myToken.tokenURI(tokenId)).to.equal(
        `https://test.com/${tokenId}`
      );
    });

    it("should only be callable by owner", async function () {
      const tokenId = await mintAndGetTokenId();

      const receipt = myToken
        .connect(other)
        .setBaseTokenURI("https://test.com/");

      await expect(receipt).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await myToken.tokenURI(tokenId)).to.equal(`${BASE_URI}${tokenId}`);
    });
  });

  describe("setMaxSupply", () => {
    it("should increase the max supply of tokens", async () => {
      await myToken.setMaxSupply(MAX_TOKENS + 1);

      expect(await myToken.getMaxSupply()).to.eq(MAX_TOKENS + 1);
    });

    it("should be able to mint more tokens after increasing supply", async () => {
      await mintMultiple(MAX_TOKENS);

      await myToken.setMaxSupply(MAX_TOKENS + 1);
      const tokenId = await mintAndGetTokenId();

      expect(tokenId).to.eq(MAX_TOKENS + 1);
    });

    it("should not change the supply if it's not called by the owner", async () => {
      const receipt = myToken.connect(other).setMaxSupply(MAX_TOKENS + 1);

      await expect(receipt).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await myToken.getMaxSupply()).to.eq(MAX_TOKENS);
    });
  });

  describe("setMintPrice", () => {
    it("should change the minting price", async () => {
      const newMintPrice = parseEther("0.2");

      await myToken.setMintPrice(newMintPrice);

      expect(await myToken.getMintPrice()).to.eq(newMintPrice);
    });

    it("should revert with the new price", async () => {
      const newMintPrice = parseEther("0.2");
      await myToken.setMintPrice(newMintPrice);

      const receipt = myToken.mint(other.address, {
        value: parseEther("0.09"),
      });

      await expect(receipt).to.be.revertedWith(
        "minting price is not equal to mintPrice"
      );
      expect(await ethers.provider.getBalance(myToken.address)).to.eq(
        parseEther("0").toString()
      );
    });

    it("should not change the minting price if it's not called by the owner", async () => {
      const newMintPrice = parseEther("0.2");

      const receipt = myToken.connect(other).setMintPrice(newMintPrice);

      await expect(receipt).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await myToken.getMintPrice()).to.eq(MINT_PRICE);
    });
  });

  describe("setLaunchDate", () => {
    it("should change the launch date", async () => {
      const newDate = dateToBlockchain(add(new Date(), { hours: 1 }));

      await myToken.setLaunchDate(newDate);

      expect(await myToken.getLaunchDate()).to.eq(newDate);
    });

    it("cannot change the launch date before the current date", async () => {
      const newDate = dateToBlockchain(sub(new Date(), { seconds: 1 }));

      const receipt = myToken.setLaunchDate(newDate);

      expect(receipt).to.be.revertedWith(
        "launch date should be greated than now"
      );
    });
  });

  describe("withdrawFunds", () => {
    it("should return all funds to caller", async () => {
      const numTokens = 3;
      await mintMultiple(numTokens);

      const receipt = myToken.withdrawFunds();

      await expect(() => receipt).to.changeEtherBalance(
        owner,
        MINT_PRICE.mul(numTokens)
      );
      expect(await ethers.provider.getBalance(myToken.address)).to.eq(
        parseEther("0").toString()
      );
    });

    it("should not return funds to caller if it's not the owner", async () => {
      const numTokens = 3;
      await mintMultiple(numTokens);

      const receipt = myToken.connect(other).withdrawFunds();

      await expect(receipt).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await ethers.provider.getBalance(myToken.address)).to.eq(
        MINT_PRICE.mul(numTokens)
      );
    });
  });
});

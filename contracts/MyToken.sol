// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC721Pausable, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;
    uint256 private maxSupply;
    uint256 private mintPrice;
    string private baseTokenURI;
    uint256 private launchDate;

    constructor(
        uint256 _maxSupply,
        string memory _baseTokenURI,
        uint256 _mintPrice,
        uint256 _launchDate
    ) ERC721("MyToken", "MTK") {
        maxSupply = _maxSupply;
        baseTokenURI = _baseTokenURI;
        mintPrice = _mintPrice;
        launchDate = _launchDate;
    }

    function mint(address _to) public payable returns (uint256) {
        require(
            block.timestamp >= launchDate,
            "minting not enabled yet, please wait"
        );
        require(
            msg.value == mintPrice,
            "minting price is not equal to mintPrice"
        );
        require(tokenIds.current() < maxSupply, "max supply minted");

        tokenIds.increment();
        uint256 newItemId = tokenIds.current();
        _mint(_to, newItemId);

        return newItemId;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseTokenURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        require(_maxSupply >= maxSupply, "can't reduce supply");
        require(
            _maxSupply > tokenIds.current(),
            "new supply must exceed exceed existing tokens"
        );

        maxSupply = _maxSupply;
    }

    function getMaxSupply() public view returns (uint256) {
        return maxSupply;
    }

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        require(_mintPrice >= 0, "mint price must be 0 or greater");

        mintPrice = _mintPrice;
    }

    function getMintPrice() public view returns (uint256) {
        return mintPrice;
    }

    function setLaunchDate(uint256 _launchDate) public onlyOwner {
        require(
            _launchDate >= block.timestamp,
            "launch date should be greated than now"
        );

        launchDate = _launchDate;
    }

    function getLaunchDate() public view returns (uint256) {
        return launchDate;
    }

    function mintEnabled() public view returns (bool) {
        return block.timestamp >= launchDate && tokenIds.current() < maxSupply;
    }

    function withdrawFunds() external onlyOwner {
        uint256 contractBalance = address(this).balance;
        (bool success,  ) = msg.sender.call{value: contractBalance}("");

        require(success, "withdrawFunds failed");
    }
}

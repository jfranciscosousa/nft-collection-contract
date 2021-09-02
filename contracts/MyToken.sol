// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC721Pausable, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 private maxSupply;
    uint256 private mintPrice;
    string private baseTokenURI;

    constructor(
        uint256 _maxSupply,
        string memory _baseTokenURI,
        uint256 _mintPrice
    ) ERC721("MyToken", "MTK") {
        maxSupply = _maxSupply;
        baseTokenURI = _baseTokenURI;
        mintPrice = _mintPrice;
    }

    function mint(address to) public payable returns (uint256) {
        require(
            msg.value == mintPrice,
            string(
                abi.encodePacked(
                    "minting price is ",
                    mintPrice.toString(),
                    " wei"
                )
            )
        );
        require(_tokenIds.current() < maxSupply, "max supply minted");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(to, newItemId);

        return newItemId;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseTokenURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    function withdrawFunds() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        require(_maxSupply >= maxSupply, "can't reduce supply");

        maxSupply = _maxSupply;
    }

    function getMaxSupply() public view returns (uint256) {
        return maxSupply;
    }

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        require(_mintPrice > 0, "mint price must be 0 or greater");

        mintPrice = _mintPrice;
    }

    function getMintPrice() public view returns (uint256) {
        return mintPrice;
    }
}

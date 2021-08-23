// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC721Pausable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("CriaTek", "CTK") {}

    function mint(address to) public payable returns (uint256) {
        require(msg.value == 0.1 ether, "minting price is 0.1 ether");
        require(_tokenIds.current() < 100, "max tokens minted");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(to, newItemId);

        return newItemId;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://my-api/tokens/";
    }

    function withdrawFunds() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}

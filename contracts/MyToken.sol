// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyToken is ERC721Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address public beneficiary;

    constructor() ERC721("CriaTek", "CTK") {
        beneficiary = msg.sender;
    }

    function mint(address to) public payable returns (uint256) {
        require(msg.value == 0.1 ether, "minting price is 0.1 ether");
        require(_tokenIds.current() < 100, "max tokens minted");

        transfer(payable(beneficiary), msg.value);
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(to, newItemId);

        return newItemId;
    }

    function lastTokenId() public view returns (uint256) {
        return _tokenIds.current();
    }

    function transfer(address payable _to, uint256 _amount) private {
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "failed to send Ether");
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://my-api/tokens/";
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "./ERC721Yield.sol";

contract Astronut is ERC721Yield {
    uint256 public id;
    uint56 private mintPrice;
    uint56 private immutable maxTokens;

    constructor(
        address _yield,
        uint56 _mintPrice) 
        ERC721("DeezAstronuts", "HDNA")
        ERC721Yield(_yield) {
        mintPrice = _mintPrice;
        id = 0;
        maxTokens = 100;

        yield.setYieldParameters(address(this), 10 ether, 1931622407);
    }

    error InsufficientFunds();

    modifier meetsMintPrice() {
        if (uint256(mintPrice) > msg.value) {
            revert InsufficientFunds();
        }
        _;
    }

    function mint() 
        public
        payable
        meetsMintPrice() {
        require(id < maxTokens, "all astronuts have been minted");

        _safeMint(msg.sender, id);
        id++;
    }
}
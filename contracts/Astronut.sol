// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "./ERC721Yield.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Astronut is ERC721Yield, Ownable {
    uint56 private immutable maxTokens;

    constructor(address _yield) 
        ERC721("DeezAstronuts", "HDNA")
        ERC721Yield(_yield) {
        maxTokens = 100;
    }

    function mint(address to, uint256 id) public onlyOwner {
        require(id < maxTokens, "all astronuts have been minted");
        _safeMint(to, id);
    }
}
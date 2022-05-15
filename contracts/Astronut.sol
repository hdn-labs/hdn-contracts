// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ERC721Yield.sol";

contract Astronut is ERC721Yield {
    using SafeMath for uint;
    using AddressHelper for address;

    uint256 public id;
    uint56 private mintPrice;
    uint56 private maxTokens;
    mapping(address => uint256[]) private owners;

    constructor(
        address _treasury,
        uint56 _mintPrice) 
        ERC721("DeezAstronuts", "HDNA")
        ERC721Yield(_treasury, 10 ether, 1931622407) {
        mintPrice = _mintPrice;
        id = 0;
        maxTokens = 100;
    }

    error InsufficientFunds();

    modifier meetsMintPrice() {
        if (uint256(mintPrice) > msg.value) {
            revert InsufficientFunds();
        }
        _;
    }

    function getTokensOwnedBy(address claimant) public view returns(uint256[] memory) {
        return owners[claimant];
    }

    function mint() 
        public
        payable
        meetsMintPrice() {
        require(id < maxTokens, "all astronuts have been minted");

        _safeMint(msg.sender, id);
        owners[msg.sender].push(id);
        id++;
    }
}
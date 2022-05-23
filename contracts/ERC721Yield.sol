// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IYieldManager} from "./YieldManager.sol";

abstract contract ERC721Yield is ERC721 {

    IYieldManager private yield;

    constructor(address _yield) {
        yield = IYieldManager(_yield);
        yield.setYieldParameters(address(this), 10 ether, 1931622407);
    }

    /**
        this will be called when minting, transferring, or burning
        when minting, "from" will be address(0)
        when burning, "to" will be address(0)
    */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        // update all pending rewards before transfer
        yield.updateRewardsFor(address(this), from);
        yield.updateRewardsFor(address(this), to);
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
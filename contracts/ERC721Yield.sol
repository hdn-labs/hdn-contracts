// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IYieldManager} from "./YieldManager.sol";

abstract contract ERC721Yield is ERC721 {

    IYieldManager internal yield;

    constructor(address _yield) {
        yield = IYieldManager(_yield);
    }

    /** @dev this will be called when minting, transferring, or burning
        @dev when minting, "from" will be address(0)
        @dev when burning, "to" will be address(0)
    */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        // update all pending rewards before transfer
        yield.updateRewards(address(this), from);
        yield.updateRewards(address(this), to);
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
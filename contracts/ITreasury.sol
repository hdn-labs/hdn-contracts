// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface ITreasury {
    function mint(address to, uint256 amt) external;
}
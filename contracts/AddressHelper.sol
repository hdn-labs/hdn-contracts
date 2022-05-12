// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

library AddressHelper {
    function isValid(address a) internal pure returns(bool) {
        return a != address(0);
    }
}
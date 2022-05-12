// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IYield {
    struct NftOwnerRewards {
        uint256 indexOfLastUpdate;
        uint256 pendingRewards;
        uint256 totalRewards;
    }

    function yield(uint256 _timeOfLastUpdate, uint256 _balance) external view returns (uint256);
    function createNftOwnerRewards(uint256 pending, uint256 total) external view returns (NftOwnerRewards memory);
}

contract AstronutYielder is IYield {
    using SafeMath for uint;

    uint256 constant public BASE_RATE = 10 ether;
    uint256 constant public SECONDS_IN_A_DAY = 86400;
    uint256 constant public END = 1931622407; // Tue Mar 18 2031 17:46:47 GMT+0000

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function _yield(uint256 lapsed) internal pure returns (uint256) {
        return lapsed.mul(BASE_RATE).div(SECONDS_IN_A_DAY);
    }

    function yield(uint256 lastUpdate, uint256 balance) external view override returns (uint256) {
        uint256 current = _min(_getCurrentIndex(), END);
        return _yield(current - lastUpdate).mul(balance);
    }

    function createNftOwnerRewards(uint256 pending, uint256 total) external view override returns (NftOwnerRewards memory) {
        return NftOwnerRewards(_getCurrentIndex(), pending, total);
    }

    function _getCurrentIndex() internal view returns (uint256) {
        return block.timestamp;
    }
}
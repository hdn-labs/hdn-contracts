// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ITreasury.sol";
import "./AddressHelper.sol";

interface IYieldManager {
    function updateRewardsFor(address token, address claimant) external;
    function setYieldParameters(address token, uint256 rate, uint256 end) external;
}

contract YieldManager is IYieldManager {
    using SafeMath for uint;
    using AddressHelper for address;

    uint256 constant public SECONDS_IN_A_DAY = 86400;
    ITreasury private treasury;

    struct YieldParameters {
        /// @dev rate of HDN rewarded (amount/day)
        uint256 rate;
        /// @dev date when rewards will stop accruing (seconds)
        uint256 end;
    }

    struct AccruedRewards {
        /// @dev last time rewards were recorded (seconds)
        uint256 indexOfLastUpdate;
        /// @dev amount of rewards recorded (HDN)
        uint256 accrued;
    }

    mapping(address => mapping(address => AccruedRewards)) public rewards;
    mapping(address => YieldParameters) public parameters;

    constructor(address _treasury) {
        treasury = ITreasury(_treasury);
    }

    /** @dev nft tokens can set their yield parameters
      * @param token the nft token
      * @param rate HDN that is accumulated over time (amount/day)
      * @param end the end date when rewards stop accruing (seconds)
      */
    function setYieldParameters(address token, uint256 rate, uint256 end) override external {
        parameters[token] = YieldParameters(rate, end);
    }

    function claimRewardsFor(address token, address claimant) public {
        require(msg.sender == claimant, "cannot claim for another address");
        uint256 pending = getPendingRewardsFor(token, claimant);
        require(pending > 0, "no rewards available");

        _resetClaimantState(token, claimant, 0);
        /// @dev mint accrued rewards directly to claimant's address
        treasury.mint(claimant, pending);
    }

    function updateRewardsFor(address token, address claimant) override external {
        require(msg.sender == token, "unauthorized state update");
        if(!claimant.isValid()) return;
        uint256 pending = getPendingRewardsFor(token, claimant);
        _resetClaimantState(token, claimant, pending);
    }

    function getPendingRewardsFor(address token, address claimant) public view returns(uint256) {
        AccruedRewards storage _rewards = rewards[token][claimant];

        uint256 lastUpdate = _rewards.indexOfLastUpdate;
        if(lastUpdate <= 0) return 0;

        YieldParameters storage params = parameters[token];
        uint256 current = _getCurrentIndex(params.end);
        if(current < lastUpdate) return 0;
        uint256 balance = IERC721(token).balanceOf(claimant);
        if(balance < 1) return _rewards.accrued;
        uint256 lapsedTime = current.sub(lastUpdate);
        uint256 pending = _calculateYield(params.rate, lapsedTime, balance);
        return pending + _rewards.accrued;
    }

    function _calculateYield(uint256 rate, uint256 lapsedTime, uint256 balance) private pure returns (uint256) {
        return rate.mul(lapsedTime.mul(balance)).div(SECONDS_IN_A_DAY);
    }

    function _getCurrentIndex(uint256 end) private view returns (uint256) {
        return _min(block.timestamp, end);
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    function _resetClaimantState(address token, address claimant, uint256 amt) private {
        rewards[token][claimant] = AccruedRewards(_getCurrentIndex(parameters[token].end), amt);
    }
}
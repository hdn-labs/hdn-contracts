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

    /** @notice set parameters for yielding tokens
      * @dev tokens can only set the state for themselves and only approved addresses can execute this function
      * @param token the token that yields HDN
      * @param rate HDN that is accumulated over time (amount/day)
      * @param end the end date when rewards stop accruing (seconds)
      */
    function setYieldParameters(address token, uint256 rate, uint256 end) override external {
        require(msg.sender == token, "unauthorized state update");
        parameters[token] = YieldParameters(rate, end);
    }

    /** @notice claim rewards for the given address and the associated NFT smart contract
      * @param token the yielding token address which the claimant owns
      * @param claimant the owner of the yielding token who has accrued rewards
     */
    function claimRewardsFor(address token, address claimant) public {
        require(msg.sender == claimant, "cannot claim for another address");
        uint256 pending = getPendingRewardsFor(token, claimant);
        require(pending > 0, "no rewards available");

        _resetClaimantState(token, claimant, 0);
        /// @dev mint accrued rewards directly to claimant's address
        treasury.mint(claimant, pending);
    }

    /** @notice update rewards on relevant events, such as minting, transfer, or burn
      * @dev this should be added to an overwritten _beforeTokenTransfer  in ERC721
      * @param token the yielding token address which the claimant owns
      * @param claimant the owner of the yielding token who has accrued rewards
     */
    function updateRewardsFor(address token, address claimant) override external {
        require(msg.sender == token, "unauthorized state update");
        if(!claimant.isValid()) return;
        uint256 pending = getPendingRewardsFor(token, claimant);
        _resetClaimantState(token, claimant, pending);
    }

    /** @notice view the rewards pending for a given claimant
      * @param token the yielding token address which the claimant owns
      * @param claimant the owner of the yielding token who has accrued rewards
     */
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
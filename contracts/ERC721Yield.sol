// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ITreasury.sol";
import "./AddressHelper.sol";

abstract contract ERC721Yield is ERC721 {
    using SafeMath for uint;
    using AddressHelper for address;

    uint256 constant public SECONDS_IN_A_DAY = 86400;

    ITreasury private treasury;
    uint256 private immutable baseRate;
    uint256 private immutable endTime;

    struct NftOwnerRewards {
        uint256 indexOfLastUpdate;
        uint256 pendingRewards;
    }
    mapping(address => NftOwnerRewards) public rewards;

    constructor(address _treasury, uint256 _baseRate, uint256 _endTime) {
        treasury = ITreasury(_treasury);
        baseRate = _baseRate;
        endTime = _endTime;
    }

    function claimRewardsFor(address claimant) public {
        require(msg.sender == claimant, "cannot claim for another address");
        uint256 pending = getPendingRewardsFor(claimant);
        require(pending > 0, "no rewards available");

        // send pending to address
        treasury.mint(claimant, pending);
        rewards[claimant] = NftOwnerRewards(_getCurrentIndex(), 0);
    }

    function getPendingRewardsFor(address claimant) public view returns(uint256) {
        if(rewards[claimant].indexOfLastUpdate <= 0) return 0;
        uint256 pending = yield(rewards[claimant].indexOfLastUpdate, this.balanceOf(claimant));
        return pending + rewards[claimant].pendingRewards;
    }

    function yield(uint256 lastUpdate, uint256 balance) internal view returns (uint256) {
        uint256 current = _min(_getCurrentIndex(), endTime);
        uint256 lapsedTime = current.sub(lastUpdate);
        return lapsedTime.mul(baseRate).mul(balance).div(SECONDS_IN_A_DAY);
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    function _getCurrentIndex() private view returns (uint256) {
        return block.timestamp;
    }

    function _updateRewardsFor(address claimant) internal {
        if(!claimant.isValid()) return;
        uint256 pending = getPendingRewardsFor(claimant);
        rewards[claimant] = NftOwnerRewards(_getCurrentIndex(), pending);
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
    ) internal override {
        // update all pending rewards before transfer
        _updateRewardsFor(from);
        _updateRewardsFor(to);
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
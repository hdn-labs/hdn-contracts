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
        uint256 rewards;
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
        _resetClaimantState(claimant, 0);
    }

    function getPendingRewardsFor(address claimant) public view returns(uint256) {
        uint256 lastUpdate = rewards[claimant].indexOfLastUpdate;
        if(lastUpdate <= 0) return 0;
        uint256 current = _getCurrentIndex();
        if(current < lastUpdate) return 0;
        uint256 balance = ERC721.balanceOf(claimant);
        uint256 accrued = rewards[claimant].rewards;
        if(balance < 1) return accrued;
        uint256 lapsedTime = current.sub(lastUpdate);
        uint256 pending = _calculateYield(baseRate, lapsedTime, balance);
        return pending + accrued;
    }

    function _calculateYield(uint256 base, uint256 lapsedTime, uint256 balance) private pure returns (uint256) {
        return base.mul(lapsedTime.mul(balance)).div(SECONDS_IN_A_DAY);
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    function _getCurrentIndex() private view returns (uint256) {
        return _min(block.timestamp, endTime);
    }

    function _updateRewardsFor(address claimant) internal {
        if(!claimant.isValid()) return;
        uint256 pending = getPendingRewardsFor(claimant);
        _resetClaimantState(claimant, pending);
    }

    function _resetClaimantState(address claimant, uint256 amt) internal {
        rewards[claimant] = NftOwnerRewards(_getCurrentIndex(), amt);
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
        _updateRewardsFor(from);
        _updateRewardsFor(to);
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
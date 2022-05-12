// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./AddressHelper.sol";
import "./HDNYieldToNut.sol";

contract Nut is ERC721 {
    using SafeMath for uint;
    using AddressHelper for address;

    IYield public yieldContract;
    uint256 public id;
    uint56 private mintPrice;

    constructor(address _yield, uint56 _mintPrice) ERC721("Nut", "NUT") {
        yieldContract = IYield(_yield);
        mintPrice = _mintPrice;
        id = 0;
    }

    error InsufficientFunds();

    modifier meetsMintPrice(uint256 amountToMint) {
        if (uint256(mintPrice) * amountToMint > msg.value) {
            revert InsufficientFunds();
        }
        _;
    }

    mapping(address => uint256[]) private owners;

    function getTokensOwnedBy(address claimant) public view returns(uint256[] memory) {
        return owners[claimant];
    }

    function mint() 
        public
        payable
        meetsMintPrice(1) {
        _safeMint(msg.sender, id);
        owners[msg.sender].push(id);
        id++;
    }

    /** Yielding */
    mapping(address => IYield.NftOwnerRewards) public rewards;

    function getPendingRewardsFor(address claimant) public view returns(uint256) {
        if(!claimant.isValid()) return 0;
        if(_isFirstTimeOwner(claimant)) return 0;

        uint256 pending = yieldContract.yield(rewards[claimant].indexOfLastUpdate, balanceOf(claimant));

        return pending + rewards[claimant].pendingRewards;
    }

    function _updateRewardsFor(address claimant) internal {
        if(!claimant.isValid()) return;

        uint256 pending = 0;
        uint256 total = 0;

        if(!_isFirstTimeOwner(claimant)) {
            pending = getPendingRewardsFor(claimant);
            total = rewards[claimant].totalRewards;
        }

        //update rewards state for next claim
        rewards[claimant] = yieldContract.createNftOwnerRewards(pending, total);
    }

    function claimRewardsFor(address claimant) public returns(uint256) {
        require(msg.sender == claimant, "cannot claim for another address");
        require(claimant.isValid(), "address is invalid");
        require(getPendingRewardsFor(claimant) > 0, "no rewards available");

        uint256 pending = getPendingRewardsFor(claimant);
        uint256 total = rewards[claimant].totalRewards + pending;

        // TODO send pending to address

        //update rewards state for next claim
        rewards[claimant] = yieldContract.createNftOwnerRewards(0, total);

        return pending;
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
        // claim all pending rewards before transfer
        _updateRewardsFor(from);
        _updateRewardsFor(to);
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _isFirstTimeOwner(address a) internal view returns(bool) {
        if(!a.isValid()) return false;
        return rewards[a].indexOfLastUpdate <= 0;
    }
}
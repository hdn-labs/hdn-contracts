// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./AddressHelper.sol";
import "./AstronutYielder.sol";
import "./HDN.sol";

contract Astronut is ERC721 {
    using SafeMath for uint;
    using AddressHelper for address;

    IYield yieldContract;
    HDNToken tokenContract;
    uint256 public id;
    uint56 private mintPrice;
    uint56 private maxTokens;
    mapping(address => uint256[]) private owners;

    constructor(
        address _yield, 
        address _token,
        uint56 _mintPrice) ERC721("DeezAstronuts", "HDNA") {
        yieldContract = IYield(_yield);
        tokenContract = HDNToken(_token);
        mintPrice = _mintPrice;
        id = 0;
        maxTokens = 100;
    }

    error InsufficientFunds();

    modifier meetsMintPrice() {
        if (uint256(mintPrice) > msg.value) {
            revert InsufficientFunds();
        }
        _;
    }

    function getTokensOwnedBy(address claimant) public view returns(uint256[] memory) {
        return owners[claimant];
    }

    function mint() 
        public
        payable
        meetsMintPrice() {
        require(id < maxTokens, "there are no more astronuts left to be minted");

        _safeMint(msg.sender, id);
        owners[msg.sender].push(id);
        id++;
    }

    /** Yielding */
    mapping(address => IYield.NftOwnerRewards) public rewards;

    function getPendingRewardsFor(address claimant) public view returns(uint256) {
        require(claimant.isValid(), "claimant must be a valid address");

        if(_isFirstTimeOwner(claimant)) return 0;
        uint256 pending = yieldContract.yield(rewards[claimant].indexOfLastUpdate, balanceOf(claimant));
        return pending + rewards[claimant].pendingRewards;
    }

    function _updateRewardsFor(address claimant) internal {
        if(!claimant.isValid()) return;

        uint256 pending = 0;

        if(!_isFirstTimeOwner(claimant)) {
            pending = getPendingRewardsFor(claimant);
        }

        //update rewards state for next claim
        rewards[claimant] = yieldContract.createNftOwnerRewards(pending);
    }

    function claimRewardsFor(address claimant) public {
        require(msg.sender == claimant, "cannot claim for another address");
        uint256 pending = getPendingRewardsFor(claimant);
        require(pending > 0, "no rewards available");

        // send pending to address
        tokenContract.collectReward(claimant, pending);

        // update rewards state for next claim
        rewards[claimant] = yieldContract.createNftOwnerRewards(0);
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
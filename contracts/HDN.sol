// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract HDNToken is ERC20, AccessControl {
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    constructor() ERC20("HodlDeezNuts", "HDN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _mint(address(this), 50_000_000_000 ether);
        grantTreasury(msg.sender);
    }

    function collectReward(address _to, uint256 amt) external onlyRole(TREASURY_ROLE) {
        transferFrom(address(this), _to, amt);
    }

    function grantTreasury(address _to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(TREASURY_ROLE, _to);
        _approve(address(this), _to, totalSupply());
    }
}

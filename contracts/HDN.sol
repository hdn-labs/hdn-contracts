// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ITreasury.sol";

contract HDNToken is ERC20Capped, AccessControl, ITreasury {
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    constructor() 
        ERC20("HodlDeezNuts", "HDN") 
        ERC20Capped(50_000_000_000 * 10 ** 18) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantTreasury(msg.sender);
    }

    function mint(address to, uint256 amt) override external onlyRole(TREASURY_ROLE) {
        _mint(to, amt);
    }

    function grantTreasury(address _to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(TREASURY_ROLE, _to);
    }
}

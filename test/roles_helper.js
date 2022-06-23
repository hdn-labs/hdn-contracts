const { ethers } = require('hardhat');
const { Contract } = require('ethers');

const ROLES = {
  MINTER_ROLE: ethers.utils.solidityKeccak256(['string'], ['MINTER_ROLE']), // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
  TREASURY_ROLE: ethers.utils.solidityKeccak256(['string'], ['TREASURY_ROLE']),
  YIELD_ROLE: ethers.utils.solidityKeccak256(['string'], ['YIELD_ROLE']),
  DEFAULT_ADMIN_ROLE:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
};

/**
 * @param {Contract} accessControlContract
 * @param {string} checkAddressForRole
 * @param {keyof ROLES} role
 * @returns {Promise<boolean>}
 */
async function hasRole(accessControlContract, checkAddressForRole, role) {
  const role_value = ROLES[role];
  return await await accessControlContract.hasRole(
    role_value,
    checkAddressForRole
  );
}

/**
 *
 * @param {Contract} accessControlContract
 * @param {keyof ROLES} role
 * @param {string} to
 * @return {Promise<void>}
 */
async function grantRole(accessControlContract, role, to) {
  const [owner] = await ethers.getSigners();
  await await accessControlContract.connect(owner).grantRole(ROLES[role], to);
}

module.exports = {
  hasRole,
  grantRole,
  ROLES,
};

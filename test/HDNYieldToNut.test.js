const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { create, ROLES } = require('./helper');

describe('HDN Yield', function () {
  /* it('should not have the same...', async function () {
    const { hdn, yield } = await create();
    const [owner] = await ethers.getSigners();

    expect(hdn.address).to.not.equal(yield.address);
    expect(owner.address).to.not.equal(hdn.address);
    expect(owner.address).to.not.equal(yield.address);
  }); */

  /* it('should be able to mint hdn after given MINTER_ROLE', async function () {
    const { hdn, yield, grantMintRoleToYieldContract } = await create();

    //const [owner, addr1] = await ethers.getSigners();

    const mint_amount = 1000;

    await grantMintRoleToYieldContract();

    let txn0 = await yield.mint(mint_amount);
    await txn0.wait();

    expect(await hdn.totalSupply()).to.equal(mint_amount);
    expect(await hdn.balanceOf(yield.address)).to.equal(mint_amount);
  }); */

  it('should be given minting role', async function () {
    const { hdn, yield, grantMintRoleToYieldContract } = await create();

    expect(await hdn.hasRole(ROLES.MINTER_ROLE, yield.address)).to.equal(false);
    await grantMintRoleToYieldContract();
    expect(await hdn.hasRole(ROLES.MINTER_ROLE, yield.address)).to.equal(true);
  });
});

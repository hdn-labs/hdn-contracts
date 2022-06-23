const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');

use(solidity);

const { ethers } = require('hardhat');
const { create } = require('./helper');

describe('Nut', function () {
  it('mint() should allow owner to send NFT to any address', async function () {
    const { nut } = await create();
    const [owner, addr1] = await ethers.getSigners();

    expect(await nut.connect(owner).mint(addr1.address, 0)).to.be.ok;
    expect(await nut.connect(owner).mint(addr1.address, 99)).to.be.ok;
  });

  it('mint() should properly set ownership of minted NFT', async function () {
    const { nut } = await create();
    const [owner, addr1] = await ethers.getSigners();

    await nut.connect(owner).mint(addr1.address, 0);
    await nut.connect(owner).mint(addr1.address, 99);

    expect(await nut.balanceOf(owner.address)).to.equal(0);
    expect(await nut.balanceOf(addr1.address)).to.equal(2);

    expect(await nut.ownerOf(0)).to.equal(addr1.address);
    expect(await nut.ownerOf(99)).to.equal(addr1.address);
  });

  it('mint() should revert if minted id above 99', async function () {
    const { nut } = await create();
    const [owner, addr1] = await ethers.getSigners();

    await expect(nut.connect(owner).mint(addr1.address, 100)).to.be.reverted;
  });

  it('mint() should revert if called by non-owner', async function () {
    const { nut } = await create();
    const [owner, addr1] = await ethers.getSigners();

    await expect(nut.connect(owner).mint(addr1.address, 0)).to.be.ok;
    await expect(nut.connect(addr1).mint(addr1.address, 1)).to.be.reverted;
    /* revertedWith(
      /Ownable: caller is not the owner/
    ); */
  });
});

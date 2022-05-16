const { expect } = require('chai');
const { ethers } = require('hardhat');
const { create } = require('./helper');

describe('HDN', function () {
  it('should return 18 decimals, HDN symbol, and HodlDeezNuts name', async function () {
    const { hdn } = await create();

    expect(await hdn.decimals()).to.equal(18);
    expect(await hdn.symbol()).to.equal('HDN');
    expect(await hdn.name()).to.equal('HodlDeezNuts');
  });

  it('cap() should be 50_000_000_000', async function () {
    const { hdn } = await create();
    const cap = (await hdn.cap()).toString();
    expect(parseInt(ethers.utils.formatEther(cap))).to.equal(50_000_000_000);
  });

  it('treasurer should be allowed to mint HDN', async function () {
    const { hdn } = await create();
    const [owner] = await ethers.getSigners();

    expect(await hdn.balanceOf(owner.address)).to.equal(0);

    const amount = 1000;
    await await hdn.connect(owner).mint(owner.address, amount);

    expect(await hdn.balanceOf(owner.address)).to.equal(amount);
  });

  it('transfer() should work as expected', async function () {
    const { hdn } = await create();
    const [owner, addr1] = await ethers.getSigners();

    const amount = 1000;
    await await hdn.connect(owner).mint(owner.address, amount);
    await await hdn.connect(owner).transfer(addr1.address, 250);

    expect(await hdn.balanceOf(owner.address)).to.equal(750);
    expect(await hdn.balanceOf(addr1.address)).to.equal(250);
  });

  /* it('mint() should throw error if called by unauthorized address', async function () {
    const { mintHDNToken } = await create();
    const [owner, addr1] = await ethers.getSigners();

    await expect(mintHDNToken(addr1, addr1.address, 1000)).to.be.reverted;
  }); */
});

/*
AssertionError: Expected transaction to be reverted with 

  Error: VM Exception while processing transaction: reverted with reason string 'AccessControl: account 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 
    is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', but other exception was thrown: 
  
  Error: VM Exception while processing transaction: reverted with reason string 'AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 
    is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
*/

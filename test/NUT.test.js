const { expect } = require('chai');
const { ethers } = require('hardhat');
const { create, increase_time, increase_time_by_days } = require('./helper');

describe('Nut', function () {
  it('Should mint', async function () {
    const { nut, mintNutNFT } = await create();

    const [owner, addr1] = await ethers.getSigners();

    await mintNutNFT(owner);
    await mintNutNFT(addr1);

    expect(await nut.balanceOf(owner.address)).to.equal(1);
    expect(await nut.balanceOf(addr1.address)).to.equal(1);
    expect(await nut.id()).to.equal(2);
  });

  it('getTokensOwnedBy() should return token ids that are owned by the given addresss', async function () {
    const { nut, mintNutNFT } = await create();

    const [owner, addr1] = await ethers.getSigners();

    await mintNutNFT(owner);
    await mintNutNFT(addr1);
    await mintNutNFT(owner);

    expect(
      (await nut.getTokensOwnedBy(owner.address)).map((b) => b.toNumber())
    ).to.eql([0, 2]);
  });

  it('getPendingRewardsFor() should show 10 tokens per day being accrued', async function () {
    const { nut, mintNutNFT } = await create();
    const [owner] = await ethers.getSigners();

    await mintNutNFT(owner);

    // has 1 NFT but no time has passed
    expect(await getPendingRewardsForOwner()).to.equal(0 * 10);

    const sevenDays = 7 * 24 * 60 * 60;
    await increase_time(sevenDays);

    // first NFT generates 10 tokens over 7 days
    expect(await getPendingRewardsForOwner()).to.equal(7 * 10);

    await mintNutNFT(owner);

    const twoDays = 2 * 24 * 60 * 60;
    await increase_time(twoDays);

    // first NFT generates 10 tokens over 7 days + 2 days
    // second NFT generates 10 tokens over 2 days
    expect(await getPendingRewardsForOwner()).to.equal((7 + 2) * 10 + 2 * 10);

    async function getPendingRewardsForOwner() {
      let txn = await nut.getPendingRewardsFor(owner.address);
      return parseInt(ethers.utils.formatEther(txn));
    }
  });

  it('claimRewardsFor() should revert if sender is a different from the input address', async function () {
    const { nut } = await create();
    const [owner, addr1] = await ethers.getSigners();

    await expect(
      nut.connect(owner).claimRewardsFor(addr1.address)
    ).to.be.revertedWith('cannot claim for another address');
  });

  it('getPendingRewardsFor() should return 0', async function () {
    const { nut, mintNutNFT } = await create();
    const [owner] = await ethers.getSigners();

    expect(await nut.getPendingRewardsFor(owner.address)).to.be.equal(0);

    await mintNutNFT(owner);

    expect(await nut.getPendingRewardsFor(owner.address)).to.be.equal(0);
  });

  it('Should properly calculate rewards after transfer', async function () {
    const { nut, mintNutNFT } = await create();

    const [owner, addr1] = await ethers.getSigners();

    await mintNutNFT(owner);

    await increase_time_by_days(5);

    let txn2 = await nut.transferFrom(owner.address, addr1.address, 0);
    await txn2.wait();

    await increase_time_by_days(10);

    /** balances should be correct */
    expect(await nut.balanceOf(owner.address)).to.equal(0);
    expect(await nut.balanceOf(addr1.address)).to.equal(1);
    expect(await nut.id()).to.equal(1);

    /** rewards should be correct */
    expect(await getPendingRewardsFor(owner.address)).to.equal(50);
    expect(await getPendingRewardsFor(addr1.address)).to.equal(100);

    async function getPendingRewardsFor(address) {
      let txn = await nut.getPendingRewardsFor(address);
      return parseInt(ethers.utils.formatEther(txn));
    }
  });

  it('mint() should throw error if msg.value does not meet price requirement', async function () {
    const { nut } = await create();
    const [_, addr1] = await ethers.getSigners();
    await expect(nut.connect(addr1).mint()).to.be.reverted;
  });
});

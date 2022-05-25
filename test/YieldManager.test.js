const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
  create,
  increase_time_by_days,
  setBlockToEndOfYield,
} = require('./helper');

describe('YieldManager', function () {
  it('getPendingRewards() should show 10 tokens per day being accrued', async function () {
    const { nut, mintNutNFT, yield } = await create();
    const [owner] = await ethers.getSigners();

    await mintNutNFT(owner);

    // has 1 NFT but no time has passed
    expect(await getPendingRewardsForOwner()).to.equal(0 * 10);

    await increase_time_by_days(7);

    // first NFT generates 10 tokens over 7 days
    expect(await getPendingRewardsForOwner()).to.equal(7 * 10);

    await mintNutNFT(owner);

    await increase_time_by_days(2);

    // first NFT generates 10 tokens over 7 days + 2 days
    // second NFT generates 10 tokens over 2 days
    expect(await getPendingRewardsForOwner()).to.equal((7 + 2) * 10 + 2 * 10);

    async function getPendingRewardsForOwner() {
      let txn = await yield.getPendingRewards(nut.address, owner.address);
      return parseInt(ethers.utils.formatEther(txn));
    }
  });

  it('claimRewards() should revert if sender is a different from the input address', async function () {
    const { nut, yield } = await create();
    const [owner, addr1] = await ethers.getSigners();

    await expect(
      yield.connect(owner).claimRewards(nut.address, addr1.address)
    ).to.be.revertedWith('cannot claim for another address');
  });

  it('getPendingRewards() should return 0', async function () {
    const { nut, mintNutNFT, yield } = await create();
    const [owner] = await ethers.getSigners();

    expect(
      await yield.getPendingRewards(nut.address, owner.address)
    ).to.be.equal(0);

    await mintNutNFT(owner);

    expect(
      await yield.getPendingRewards(nut.address, owner.address)
    ).to.be.equal(0);
  });

  it('getPendingRewards() should properly calculate rewards after transfer', async function () {
    const { nut, mintNutNFT, yield } = await create();
    const [owner, addr1] = await ethers.getSigners();

    await mintNutNFT(owner);

    await increase_time_by_days(5);

    await await nut.transferFrom(owner.address, addr1.address, 0);

    await increase_time_by_days(10);

    /** balances should be correct */
    expect(await nut.balanceOf(owner.address)).to.equal(0);
    expect(await nut.balanceOf(addr1.address)).to.equal(1);
    expect(await nut.id()).to.equal(1);

    /** rewards should be correct */
    expect(await getPendingRewards(owner.address)).to.equal(50);
    expect(await getPendingRewards(addr1.address)).to.equal(100);

    async function getPendingRewards(address) {
      let txn = await yield.getPendingRewards(nut.address, address);
      return parseInt(ethers.utils.formatEther(txn));
    }
  });

  it('claimRewards() should transfer accurate amount of HDN rewards to nft owners', async function () {
    const { nut, mintNutNFT, hdn, yield } = await create();
    const [owner, addr1] = await ethers.getSigners();

    await mintNutNFT(owner);
    await increase_time_by_days(5);
    await await nut.transferFrom(owner.address, addr1.address, 0);
    await increase_time_by_days(10);

    /** balances should be correct */
    expect(await nut.balanceOf(owner.address)).to.equal(0);
    expect(await nut.balanceOf(addr1.address)).to.equal(1);
    expect(await nut.id()).to.equal(1);

    /** rewards should be correct */
    expect(await getPendingRewards(owner.address)).to.equal(50);
    expect(await getPendingRewards(addr1.address)).to.equal(100);

    /** claim the rewards */
    await yield.connect(owner).claimRewards(nut.address, owner.address);
    await yield.connect(addr1).claimRewards(nut.address, addr1.address);

    /** balances should match rewards claimed */
    expect(await hdnBalanceOf(owner.address)).to.equal(50);
    expect(await hdnBalanceOf(addr1.address)).to.equal(100);

    async function getPendingRewards(address) {
      let txn = await yield.getPendingRewards(nut.address, address);
      return parseInt(ethers.utils.formatEther(txn));
    }

    async function hdnBalanceOf(address) {
      let txn = await hdn.connect(address).balanceOf(address);
      return parseInt(ethers.utils.formatEther(txn));
    }
  });

  it('claimRewards() should not generate rewards after END time', async function () {
    const { nut, mintNutNFT, yield } = await create();
    const [owner, addr1] = await ethers.getSigners();

    /** rewards should be zero */
    expect(await getPendingRewards(owner.address)).to.equal(0);
    expect(await getPendingRewards(addr1.address)).to.equal(0);

    /** mint to different owners and wait some time for rewards to accrue */
    await mintNutNFT(owner);
    await mintNutNFT(addr1);

    /** sets the block to the end timestamp when yielding ends */
    await setBlockToEndOfYield();

    /** nft balances should be correct */
    expect(await nut.balanceOf(owner.address)).to.equal(1);
    expect(await nut.balanceOf(addr1.address)).to.equal(1);
    expect(await nut.id()).to.equal(2, 'unexpected amount of nfts');

    /** rewards should be greater than zero */
    expect(await getPendingRewards(owner.address)).to.greaterThan(0);
    expect(await getPendingRewards(addr1.address)).to.greaterThan(0);

    /** claim the rewards to drain pending buckets */
    await yield.connect(owner).claimRewards(nut.address, owner.address);
    await yield.connect(addr1).claimRewards(nut.address, addr1.address);

    /** mint some new yielding NFTs for kicks */
    await mintNutNFT(owner);
    await mintNutNFT(addr1);

    /** no rewards should accrue over this time */
    await increase_time_by_days(10);

    /** pending rewards should be zero */
    expect(await getPendingRewards(owner.address)).to.equal(0);
    expect(await getPendingRewards(addr1.address)).to.equal(0);

    expect(
      yield.connect(owner).claimRewards(nut.address, owner.address)
    ).to.be.revertedWith('no rewards available');
    expect(
      yield.connect(addr1).claimRewards(nut.address, addr1.address)
    ).to.be.revertedWith('no rewards available');

    async function getPendingRewards(address) {
      let txn = await yield.getPendingRewards(nut.address, address);
      return parseInt(ethers.utils.formatEther(txn));
    }
  });

  it('setYieldParameters() should revert if called by an address that has not been granted proper role', async function () {
    const { yield } = await create();
    const [_, addr1] = await ethers.getSigners();

    await expect(
      yield.connect(addr1.address).setYieldParameters(yield.address, 10, 12345)
    ).to.be.reverted;
  });

  it('updateRewards() should revert if called by an address that has not been granted proper role', async function () {
    const { yield } = await create();
    const [_, addr1] = await ethers.getSigners();

    await expect(
      yield.connect(addr1.address).updateRewards(yield.address, addr1.address)
    ).to.be.reverted;
  });

  //it('', async function () {});
  /**
   * possible tests
   *
   * _updateRewardsFor() should not update rewards for recipient of NFT transfer if the transfer fails*
   */
});

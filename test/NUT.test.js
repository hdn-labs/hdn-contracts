const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
  create,
  increase_time,
  increase_time_by_days,
  getAddressBalance,
  setBlockToEndOfYield,
  mint_price,
} = require('./helper');

describe('Nut', function () {
  it('mint() should send ERC71 tokens to their respective minters and minters should pay the mint price', async function () {
    const { nut, mintNutNFT } = await create();
    const [owner, addr1] = await ethers.getSigners();

    expect(await getAddressBalance(nut.address)).to.equal('0.0');

    await mintNutNFT(owner);
    await mintNutNFT(addr1);

    expect(await nut.balanceOf(owner.address)).to.equal(1);
    expect(await nut.balanceOf(addr1.address)).to.equal(1);
    expect(await nut.id()).to.equal(2);

    expect(parseInt(await getAddressBalance(nut.address))).to.equal(
      mint_price * 2
    );
  });

  /* it('getTokensOwnedBy() should return token ids that are owned by the given addresss', async function () {
    const { nut, mintNutNFT } = await create();

    const [owner, addr1] = await ethers.getSigners();

    await mintNutNFT(owner);
    await mintNutNFT(addr1);
    await mintNutNFT(owner);

    expect(
      (await nut.getTokensOwnedBy(owner.address)).map((b) => b.toNumber())
    ).to.eql([0, 2]);
  }); */

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

  it('getPendingRewardsFor() should properly calculate rewards after transfer', async function () {
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

  it('claimRewardsFor() should transfer accurate amount of HDN rewards to nft owners', async function () {
    const { nut, mintNutNFT, hdn } = await create();
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
    expect(await getPendingRewardsFor(owner.address)).to.equal(50);
    expect(await getPendingRewardsFor(addr1.address)).to.equal(100);

    /** claim the rewards */
    await nut.connect(owner).claimRewardsFor(owner.address);
    await nut.connect(addr1).claimRewardsFor(addr1.address);

    /** balances should match rewards claimed */
    expect(await hdnBalanceOf(owner.address)).to.equal(50);
    expect(await hdnBalanceOf(addr1.address)).to.equal(100);

    async function getPendingRewardsFor(address) {
      let txn = await nut.getPendingRewardsFor(address);
      return parseInt(ethers.utils.formatEther(txn));
    }

    async function hdnBalanceOf(address) {
      let txn = await hdn.connect(address).balanceOf(address);
      return parseInt(ethers.utils.formatEther(txn));
    }
  });

  it('claimRewardsFor() should not generate rewards after END time', async function () {
    const { nut, mintNutNFT, hdn } = await create();
    const [owner, addr1] = await ethers.getSigners();

    /** rewards should be zero */
    expect(await getPendingRewardsFor(owner.address)).to.equal(0);
    expect(await getPendingRewardsFor(addr1.address)).to.equal(0);

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
    expect(await getPendingRewardsFor(owner.address)).to.greaterThan(0);
    expect(await getPendingRewardsFor(addr1.address)).to.greaterThan(0);

    /** claim the rewards to drain pending buckets */
    await nut.connect(owner).claimRewardsFor(owner.address);
    await nut.connect(addr1).claimRewardsFor(addr1.address);

    /** no rewards should accrue over this time */
    await increase_time_by_days(10);

    /** pending rewards should be zero */
    expect(await getPendingRewardsFor(owner.address)).to.equal(0);
    expect(await getPendingRewardsFor(addr1.address)).to.equal(0);

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

  /**
   * possible tests
   *
   * _updateRewardsFor() should not update rewards for receipent of NFT transfer if the transfer fails*
   */
});

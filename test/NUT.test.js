const { expect } = require('chai');
const { ethers } = require('hardhat');
const { create, getAddressBalance, mint_price } = require('./helper');

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

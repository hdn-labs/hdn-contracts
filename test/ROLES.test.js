const { expect } = require('chai');
const { ethers } = require('hardhat');
const { create } = require('./helper');
const { hasRole } = require('./roles_helper');

describe('ROLES', function () {
  it('owner should have DEFAULT_ADMIN_ROLE granted by hdn and yield manager', async function () {
    const { hdn, yield } = await create();
    const [owner] = await ethers.getSigners();

    expect(await hasRole(hdn, owner.address, 'DEFAULT_ADMIN_ROLE')).to.be.true;
    expect(await hasRole(yield, owner.address, 'DEFAULT_ADMIN_ROLE')).to.be
      .true;
  });

  it('Yield Manager should have the TREASURY_ROLE granted by the hdn token', async function () {
    const { hdn, yield } = await create();

    expect(await hasRole(hdn, yield.address, 'TREASURY_ROLE')).to.be.true;
  });

  it('Astronut should have the YIELD_ROLE granted by the yield manager', async function () {
    const { yield, nut } = await create();

    expect(await hasRole(yield, nut.address, 'YIELD_ROLE')).to.be.true;
  });
});

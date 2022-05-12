const { SignerWithAddress } = require('@nomiclabs/hardhat-ethers/signers');
const { ethers } = require('hardhat');

/**
 *
 * @param {string} id
 * @param  {...any} args
 * @returns {Promise<ethers.Contract>}
 */
async function deploy(id, ...args) {
  const factory = await ethers.getContractFactory(id);
  const contract = await factory.deploy(...(args ?? []));
  await contract.deployed();
  return contract;
}

const mint_price = 500;
const mint_price_ethers = ethers.utils.parseEther(mint_price.toString());

const ROLES = {
  //web3.utils.soliditySha3('DELEGATE_ROLE')
  MINTER_ROLE: ethers.utils.solidityKeccak256(['string'], ['MINTER_ROLE']), // 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
  TREASURY_ROLE: ethers.utils.solidityKeccak256(['string'], ['TREASURY_ROLE']),
  DEFAULT_ADMIN_ROLE:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
};

module.exports = {
  ROLES,
  increase_time,
  increase_time_by_days: async function (days) {
    increase_time(days * 24 * 60 * 60);
  },
  mineNBlocks,
  getLatestBlock,
  create: async function () {
    const [yield, hdn] = await Promise.all([
      deploy('HDNYieldToNut'),
      deploy('HDNToken'),
    ]);

    const nut = await deploy('Nut', yield.address, hdn.address, mint_price);
    const [owner] = await ethers.getSigners();
    await await hdn.connect(owner).grantTreasury(nut.address);

    return {
      hdn,
      nut,
      yield,
      grantRole,
      grantMintRoleToYieldContract: async function () {
        const [owner] = await ethers.getSigners();

        let txn = await hdn
          .connect(owner)
          .grantRole(ROLES.MINTER_ROLE, yield.address);

        await txn.wait();
      },
      mintNutNFT,
      mint_price_ethers,
    };

    /**
     *
     * @param {ethers.Contract} forContract
     * @param {keyof ROLES} role
     * @param {string} to
     */
    async function grantRole(forContract, role, to) {
      const [owner] = await ethers.getSigners();
      let txn = await forContract.connect(owner).grantRole(ROLES[role], to);
      await txn.wait();
    }

    /**
     * @param {ethers.Signer | ethers.providers.Provider | string} account
     */
    async function mintNutNFT(account) {
      const txn = await nut.connect(account).mint({ value: mint_price_ethers });
      await txn.wait();
      return txn;
    }
  },
};

/**
 * increase the amount of time that has passed and then mine the next block
 * @param {int} time in milliseconds
 */
async function increase_time(time) {
  await ethers.provider.send('evm_increaseTime', [time]);
  await ethers.provider.send('evm_mine');
}

async function mineNBlocks(n) {
  for (let index = 0; index < n; index++) {
    await ethers.provider.send('evm_mine');
  }
}

async function getLatestBlock() {
  await ethers.provider.getBlock('latest');
}

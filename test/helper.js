const { SignerWithAddress } = require('@nomiclabs/hardhat-ethers/signers');
const { ethers } = require('hardhat');

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
    const yield = await deploy('HDNYieldToNut');
    const hdn = await deploy('HDNToken');
    const nut = await deploy('Nut', yield.address, mint_price);

    return {
      hdn,
      nut,
      yield,
      grantMintRoleToYieldContract: async function () {
        const [owner] = await ethers.getSigners();

        let txn = await hdn
          .connect(owner)
          .grantRole(ROLES.MINTER_ROLE, yield.address);

        await txn.wait();
      },
      mintToOwner: async function (amount) {
        const [owner] = await ethers.getSigners();
        await mintHDNToken(owner, owner.address, amount);
      },
      mintHDNToken,
      mintNutNFT,
      mint_price_ethers,
    };

    /**
     *
     * @param {SignerWithAddress} caller caller of the function [msg.sender]
     * @param {string} to send tokens to address
     * @param {number} amount amount of tokens to mint
     */
    async function mintHDNToken(caller, to, amount) {
      let txn0 = await hdn.connect(caller).mint(to, amount);
      await txn0.wait();
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

/** references:
 *   - https://hardhat.org/hardhat-network/reference/
 */

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
const end_time = 1931622407;

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
  getAddressBalance,
  setNextBlockTimestamp,
  setBlockToEndOfYield,
  mint_price_ethers,
  mint_price,
  create: async function () {
    const [hdn] = await Promise.all([deploy('HDNToken')]);

    const nut = await deploy('Astronut', hdn.address, mint_price);
    const [owner] = await ethers.getSigners();
    await await hdn.connect(owner).grantTreasury(nut.address);

    return {
      hdn,
      nut,
      grantRole,
      mintNutNFT,
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

/**
 * sets the next timestamp and mines to that block
 * @param {int} timestamp in seconds e.g. 1931622407 * 1000 (=> 3/18/2031, 1:46:47 PM), new Date('3/18/2031, 1:46:47 PM').getTime() [javascript returns in milliseconds, blockchain is in seconds]
 */
async function setNextBlockTimestamp(timestamp) {
  await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp]);
  await ethers.provider.send('evm_mine');
}

async function setBlockToEndOfYield() {
  //console.log(new Date(end_time * 1000).toLocaleString());
  await setNextBlockTimestamp(end_time * 1000);
  //console.log((await ethers.provider.getBlock()).timestamp, end_time * 1000);
}

async function getAddressBalance(address) {
  const balance = await ethers.provider.getBalance(address);
  //console.log(balance.toString()); // prints 100000000000... 18 zeros
  // to format the value in a readable format
  return ethers.utils.formatEther(balance);
}

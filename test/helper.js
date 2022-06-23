/** references:
 *   - https://hardhat.org/hardhat-network/reference/
 */

const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { Contract, Signer } = require('ethers');
const { ROLES, grantRole } = require('./roles_helper');
/**
 *
 * @param {string} id
 * @param  {...any} args
 * @returns {Promise<Contract>}
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
const yield_rate = BigNumber.from(10).pow(19); //wei/day

module.exports = {
  ROLES,
  increase_time,
  increase_time_by_days: async function (days) {
    await increase_time(days * 24 * 60 * 60);
  },
  mineNBlocks,
  getLatestBlock,
  getAddressBalance,
  setNextBlockTimestamp,
  setBlockToEndOfYield,
  getBlockTimestamp,
  mint_price_ethers,
  mint_price,
  create: async function () {
    let nft_counter = 0;
    const [owner] = await ethers.getSigners();

    const hdn = await deploy('HDNToken');
    const yield = await deploy('YieldManager', hdn.address);

    // YieldManager needs TREASURY_ROLE granted by HDNToken
    await grantRole(hdn, 'TREASURY_ROLE', yield.address);

    const nut = await deploy('Astronut', yield.address);

    // Astronut needs YIELD_ROLE granted by YieldManager
    await grantRole(yield, 'YIELD_ROLE', nut.address);

    // set the yield parameters for Astronut
    await await yield
      .connect(owner)
      .setYieldParameters(nut.address, yield_rate, end_time);

    return {
      hdn,
      yield,
      nut,
      mintNutNFT,
    };

    /**
     * @param {Signer | ethers.providers.Provider | string} account
     */
    async function mintNutNFT(account) {
      const txn = await nut.connect(owner).mint(account.address, nft_counter++);
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

/**
 *
 * @returns {number} timestamp in seconds
 */
async function getBlockTimestamp() {
  return (await ethers.provider.getBlock()).timestamp;
}

async function getAddressBalance(address) {
  const balance = await ethers.provider.getBalance(address);
  //console.log(balance.toString()); // prints 100000000000... 18 zeros
  // to format the value in a readable format
  return ethers.utils.formatEther(balance);
}

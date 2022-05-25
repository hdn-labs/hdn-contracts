const {
  deploy,
  createAccount,
  getSigner,
  getContract,
  createClient,
} = require('./utils');
const { hethers } = require('@hashgraph/hethers');
const accounts = require('./accounts');

//const op = operator();
//const wallet = op.asWallet();
/* wallet.getBalance(op.wallet_address).then((b) => {
  console.log(
    `\n- Wallet address balance: ${hethers.utils.formatHbar(b.toString())} hbar`
  );
}); */

function deployContract() {
  const provider = hethers.providers.getDefaultProvider('testnet');
  const wallet = accounts.signer.asWallet(provider);
  deploy('hdn_token', wallet).then(console.log).catch(console.error);
}

function getHDNTokenContract(wallet) {
  const contract = getContract(
    'hdn_token',
    wallet,
    '0x00000000000000000000000000000000020cecf1'
  );

  return contract;
}

function getNutNFTContract(wallet) {
  const contract = getContract(
    'astronut',
    wallet,
    '0x000000000000000000000000000000000211bb5d'
  );

  return contract;
}

/**
 * @param {accounts.AccountHelper} acnt
 */
async function mintHDN(acnt) {
  const provider = hethers.providers.getDefaultProvider('testnet');
  const wallet = acnt.asWallet(provider);
  const contract = getHDNTokenContract(wallet);
  const result = await contract.mint(wallet.address, 1000, {
    gasLimit: 100_000,
  });
  console.log(result);
}

/**
 * @param {accounts.AccountHelper} acnt
 */
async function checkHDNBalance(acnt) {
  const provider = hethers.providers.getDefaultProvider('testnet');
  const wallet = acnt.asWallet(provider);
  const address = wallet.address;
  console.log(address);
  const contract = getHDNTokenContract(wallet);
  const balance = await contract.balanceOf(address, {
    gasLimit: 100_000,
  });
  console.log(balance.toString());
}

async function deployNFTContract() {
  const provider = hethers.providers.getDefaultProvider('testnet');
  const wallet = accounts.signer.asWallet(provider);

  const yield_address = await deploy('yield', wallet);
  deploy('nut', wallet, [yield_address, 50])
    .then(console.log)
    .catch(console.error);
}

/**
 * @param {accounts.AccountHelper} acnt
 */
async function mintNutNFT(acnt) {
  const provider = hethers.providers.getDefaultProvider('testnet');
  const wallet = acnt.asWallet(provider);
  console.log((await wallet.getBalance()).toString());
  const contract = getNutNFTContract(wallet);
  const result = await contract.connect(wallet).mint({
    value: 50, // hethers.utils.parseHbar('0.000500'),
    gasLimit: 1_000_000,
  });
  console.log(result);
}

/**
 * @param {accounts.AccountHelper} acnt
 */
async function getPendingRewards(acnt) {
  const provider = hethers.providers.getDefaultProvider('testnet');
  const wallet = acnt.asWallet(provider);
  console.log((await wallet.getBalance()).toString());
  const contract = getNutNFTContract(wallet);
  const result = await contract.getPendingRewards(wallet.address, {
    gasLimit: 1_000_000,
  });
  console.log(result);
  return result;
}

//deployContract();
getHDNTokenContract();
checkHDNBalance(accounts.signer);
//mintHDN(accounts.account1);
//createAccount(1000);
//deployNFTContract();
//mintNutNFT(accounts.signer);
getPendingRewards(accounts.signer)
  .then((r) => console.log(hethers.utils.formatUnits(r, 18)))
  .catch(console.error);

/*
nft mint details

transactionId: '0.0.34401519-1651951781-489633395',
  hash: '0xeb4b980db14706d45173da3262c17eb3c4960227d7cb56132a92440bf8063511fbc9c1301070e834a2b148745c2da61f',
  from: '0x00000000000000000000000000000000020cecef',
  to: '0x000000000000000000000000000000000211bb5d',
*/

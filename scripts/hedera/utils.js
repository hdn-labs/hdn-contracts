const accounts = require('./accounts');
const {
  Client,
  AccountId,
  PrivateKey,
  AccountCreateTransaction,
  Hbar,
  Wallet,
} = require('@hashgraph/sdk');
const { hethers } = require('@hashgraph/hethers');
const contracts = require('../contracts');

function createClient() {
  let { accountId, privateKey } = accounts.operator;
  const client = Client.forTestnet().setOperator(accountId, privateKey);
  return client;
}

/**
 * @returns {{accountId: string, privateKey: string}}
 */
function getSigner() {
  return JSON.parse(require('fs').readFileSync('./signer.json'));
}

async function createAccount(initialBalance, client = undefined) {
  client ??= createClient();
  const newPk = PrivateKey.generateECDSA();

  console.log(`private key = ${newPk.toString()}`);
  console.log(`public key = ${newPk.publicKey.toString()}`);

  const response = await new AccountCreateTransaction()
    .setInitialBalance(new Hbar(initialBalance)) // h
    .setKey(newPk.publicKey)
    .execute(client);

  const receipt = await response.getReceipt(client);

  const account = {
    accountId: receipt.accountId.toString(),
    privateKey: '0x'.concat(newPk.toStringRaw()),
  };
  console.log(account);

  //require('fs').writeFileSync('./signer.json', JSON.stringify(account));
  return account;
}

/**
 * @param id {keyof contracts}
 * @param signer {Wallet}
 * @param args {any[]}
 */
async function deploy(id, signer, args = []) {
  const { abi, bytecode } = contracts[id];
  const factory = new hethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy(...args, { gasLimit: 300000 });

  // Wait until the transaction reaches consensus (i.e. contract is deployed)
  //  - returns the receipt
  //  - throws on failure (the reciept is on the error)
  const contractReceipt = await contract.deployTransaction.wait();
  console.log(
    `\n- contract deployment status: ${contractReceipt.status.toString()}`
  );

  console.log('\n- contract address: ', contract.address);
  console.log('\n- contract receipt: ', JSON.stringify(contractReceipt, 0, 2));
  return contract.address;
}

/**
 * @param id {keyof contracts}
 * @param signer {Wallet}
 * @param address {string}
 * @returns {hethers.Contract}
 */
function getContract(id, signer, address) {
  const { abi } = contracts[id];
  const contract = new hethers.Contract(address, abi, signer);
  return contract;
}

module.exports = {
  contracts,
  createClient,
  createAccount,
  deploy,
  getContract,
  getSigner,
};

const { hethers } = require('@hashgraph/hethers');
const { PrivateKey } = require('@hashgraph/sdk');
const fs = require('fs');

/**
 * @typedef StoredHederaAccount
 * @property {string} accountId
 * @property {string} privateKey
 * @property {string} publicKey
 *
 * @typedef AccountState
 * @property {StoredHederaAccount} operator
 * @property {StoredHederaAccount} signer
 * @property {StoredHederaAccount} account1
 *
 * @typedef {StoredHederaAccount & { to0x: () => string, asWallet: (provider: hethers.providers.BaseProvider) => hethers.Wallet }} AccountHelper
 */

/**
 * @returns {AccountState}
 */
function getState() {
  return JSON.parse(fs.readFileSync('./accounts.json'));
}

const state = getState();

/**
 *
 * @param {StoredHederaAccount} account
 * @returns {AccountHelper}
 */
function create(account) {
  const { accountId, privateKey } = account;

  return {
    ...account,
    to0x: function () {
      const pk = PrivateKey.fromString(privateKey);
      return '0x'.concat(pk.toStringRaw());
    },
    /**
     * transform account into wallet
     * @param {hethers.providers.BaseProvider} provider
     * @returns {hethers.Wallet}
     */
    asWallet: function (provider) {
      /*
        const wallet = new hethers.Wallet(privateKey, provider);
        let connectAccount = wallet.connectAccount(accountId); 
        const address = connectAccount.address;
      */
      return new hethers.Wallet(
        {
          account: accountId,
          privateKey: this.to0x(),
        },
        provider
      );
    },
  };
}

module.exports = {
  operator: create(state.operator),
  signer: create(state.signer),
  account1: create(state.account1),
};

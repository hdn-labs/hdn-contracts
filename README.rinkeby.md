# 💧 Faucet

You will need to...

- create an address
- connect to the rinkeby network
- get fake eth from a faucet

| Faucet            | Url                                   |
| ----------------- | ------------------------------------- |
| ⭐ Rinkeby Faucet | https://www.rinkebyfaucet.com/        |
| MyCrypto          | https://app.mycrypto.com/faucet       |
| Buildspace        | https://buildspace-faucet.vercel.app/ |
| Ethily            | https://ethily.io/rinkeby-faucet/     |
| Official Rinkeby  | https://faucet.rinkeby.io/            |

# ✨ NFT Viewers

| name    | website                      | specific NFT                                                                         |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------ |
| Opensea | https://testnets.opensea.io/ | https://testnets.opensea.io/assets/INSERT_CONTRACT_ADDRESS_HERE/INSERT_TOKEN_ID_HERE |
| Rarible | https://rinkeby.rarible.com/ | https://rinkeby.rarible.com/token/INSERT_CONTRACT_ADDRESS_HERE:INSERT_TOKEN_ID_HERE  |

# 🚀 Deployed

smart contract addresses deployed

- 0x580c3083a600FF2dfe0d30C1dE84c46080f6A9B0 :: [NFTs](https://testnets.opensea.io/collection/squarenft-1yjwgufdid) :: [etherscan](https://rinkeby.etherscan.io/address/0x580c3083a600FF2dfe0d30C1dE84c46080f6A9B0)
- 0x850BdF73FEF79b5C43fF1B6902174Bf7E96c320d :: [etherscan](https://rinkeby.etherscan.io/address/0x850BdF73FEF79b5C43fF1B6902174Bf7E96c320d)

# 🚀 Deployment: Alchemy

So, when we want to perform an action that changes the blockchain we call it a transaction. For example, sending someone ETH is a transaction because we're changing account balances. Doing something that updates a variable in our contract is also considered a transaction because we're changing data. Minting an NFT is a transaction because we're saving data on the contract.

Deploying a smart contract is also a transaction.

Remember, the blockchain has no owner. It's just a bunch of computers around the world run by miners that have a copy of the blockchain.
When we deploy our contract, we need to tell all those miners, "hey, this is a new smart contract, please add my smart contract to the blockchain and then tell everyone else about it as well".

This is where [Alchemy](https://dashboard.alchemyapi.io) comes in.

Alchemy essentially helps us broadcast our contract creation transaction so that it can be picked up by miners as quickly as possible. Once the transaction is mined, it is then broadcasted to the blockchain as a legit transaction. From there, everyone updates their copy of the blockchain.

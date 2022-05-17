# 🥜 The Architecture of HDN

This document covers all the desired use cases, limitations, security concerns and technical decisions for the HDN smart contracts.

# 🚀 The Astronuts Token

The first NFT series that HDN is releasing will be the Astronuts. This is an ERC721 token. These non-fungible tokens will yield fungible tokens over time, be subject to a small royalty fee, and have a mint price.

Technical Features

- payable mint
- royalties
- yielding

## 👑 Royalties

Programming a fee into the NFT that pays the selling owner (especially past owners) is a challenging issue. For virtually any asset an address owns, the transferring of that asset to another address must occur under one of the following scenarios

1. The owner executes a `transfer()` or equivalent function that transfers the asset to another address
2. The owner gives approval to another party (usually a trusted smart contract) for them to use the `transfer()` (or equivalent) function to send the asset to another address under certain circumstances
   - for instance, this could be a NFT marketplace where the NFT owner wants to list their NFT for sale
   - In order for this to happen, the owner must go through a process that ultimately gives the marketplace's smart contract, which handles the sales, to call the `transfer()` function under certain conditions
   - The main condition that must be met, of course, is typically a sales price. In other words, the marketplace's smart contract cannot execute the `transfer()` function unless the specified sales price has been met by the address attempting to purchase the NFT/asset
   - Other conditions or features can be added to the third party smart contract, such as royalties where previous owners who have sold the NFT through the marketplace earn a percentage of the sale
   - NOTE: the asset (NFT) must be sold <i>through the marketplace</i> since that is the level on which the royalties feature exists

It is possible to override an NFT's `transfer()` function and add logic that takes some fixed amount or a percentage of the `msg.value` used for the `transfer()` function as the royalty fee. However, this doesn't ultimately make sense since it is (usually) only the owner that can call the `transfer()` function. If the owner is required to pay an amount to call the `transfer()` function, then that means they will have to pay (more than just the gas) in order to transfer an asset they own to another address they own, if that is something they need to do.

Ultimately, any royalty fee must come from the `msg.value` property in a smart contract, which is a value added to a transaction on top of the gas. Usually, the concept with royalties is that the buyer supplies the funds. This means that the buyer must be the one to execute the transaction from a smart contract point of view. However, a buyer who does not yet own the NFT cannot call the `transfer()` function on an NFT they do not own.

The owner of the NFT can only hand over the asset by calling the `transfer()` function, not the buyer. Given this, the sale of an asset typically involves a third party contract to ensure a secure transaction (like in the example of a marketplace). Otherwise, the buyer and seller could privately handle the transaction themselves, moving forward in good faith that the buyer will send the funds to the seller and the seller will send the NFT to the buyer.

With all that said, the only feasible use case for implementing royalties into the NFT smart contract itself (without bringing in a third party contract) is overriding the `transfer()` function, taking some amount from `msg.value` and sending that to a constant address, which is usually some address owned by the organization, developers, or creators of the NFT. This means that the current owner of an NFT, instead of receiving royalties themselves, they will be paying the creators of the NFT. Furthermore, this is dependent on some value being in `msg.value` during a `transfer()` execution. This is likely uncommon if an owner is simply transferring their NFT to another address they own.

Another possibility for royalties (if there is no existing marketplace which provides this capability) is deploying another smart contract which can be used to handle the sale. However, there is no guarantee that parties will use this smart contract to sell or buy the assets.

# 💸 Yielding

HDN is a fungible token with a limited supply of 50 billion. Owning an Astronut makes the owner eligible to claim HDN, which accrues over time.

## How Rewards are Collected

Rewards are not automatically transferred to NFT owners

1. Every transfer of tokens costs gas
   - Who is paying the gas if the rewards are automatically sent to NFT owners?
   - It can't be the NFT owners themselves since a contract cannot force an account to pay for the gas fees its sending tokens to
2. There would have to be some kind of centralized program executing the release of claimable rewards to the NFT owners on a set timer

These two points present significant scaling issues.

Instead, the owners must claim their rewards individually

- This is how virtually all DEX/LP contracts work
- This solves for the scaling issues presented in the previous point
  - NFT owners will pay for the gas fees themselves
  - no centralized program needs to be created and execute on a set timer
- Owners will decide for themselves when they want to claim their rewards and how often (consider tax implications)

Designing it this way is beneficial to both parties. The owners/developers will not need to pay for reoccurring gas fees and NFT owners retain their ability to decide when they receive their rewards and how often.

## How are Rewards Calculated

HDN tokens are rewarded to eligible NFT owner's over time (tokens per unit of time, HDN per day, etc.). The reward logic is given an END time which is a date when the yielding will end.

The contract must therefore be able to accurately determine how much each NFT owner has accrued over time while accounting for the given END time and changes in the NFT balances due to transfers, minting, or burning.

To illustrate the reasoning behind the current implementation, imagine that address 0x00 mints an Astronut. Exactly one day later, address 0x00 mints another Astronut. Exactly one day later, address 0x00 wants to check the amount of HDN they have pending. Given that the reward rate is 10 tokens per day, address 0x00 should expect to see 30 tokens pending. That is, 20 tokens accrued from the first Astronut minted two days prior, and 10 tokens from the second Astronut minted the day prior.

This logic requires that a timestamp be recorded when address 0x00 mints their first NFT. Armed with that initial timestamp, the logic would be something like `(current_timestamp - initial_timestamp)[=2 days] * 10 (tokens/NFT/day) * nft_balance[=2 NFTs]`. However, notice that, if implemented this way, the calculation would return 40 tokens instead of the expected 30 tokens. How is that the case? The `current_timestamp - initial_timestamp` can be thought of the lapsed time between address 0x00 minting their first NFT and when they go to check their pending rewards. The total amount of days is 2. Therefore, the calculation is `2 (days) * 10 (tokens/NFT/day) * nft_balance[=2 NFTs] = 40 tokens`. Where is this logic going wrong?

It is failing to account for the fact that the second NFT minted only accrued rewards over a period of exactly one day, as opposed to the initial NFT minted accrued rewards over two days. That is where the extra 10 tokens is coming from. How can the logic be corrected to account for this kind of scenario?

The yielding logic tracks two variables for every address: `indexOfLastUpdate` and `rewards`. Instead of only recording the initial timestamp when address 0x00 minted their first Astronaut, the logic now records the timestamp every time address 0x00 mints a new NFT and sets it to `indexOfLastUpdate`. Furthermore, when it records a new timestamp, it also calculates the rewards earned up to that point and adds it to `rewards`. This way, when address 0x00 mints their second Astronut, the amount of tokens accrued from their initial NFT is 10 and that is added to `rewards` while `indexOfLastUpdate` is overwritten from the initial timestamp to the current timestamp. This way, when address 0x00 checks their pending rewards exactly one day later, the algorithm looks more like this: `rewards[=10 tokens] + (current_timestamp - indexOfLastUpdate_timestamp)[=1 day] * 10 (tokens/NFT/day) * nft_balance[=2 NFTs] = 30 tokens`

The logic also includes checking for when the given END time has been reached and ensuring no rewards are generated after that time.

<br>

## ⚠️ Caution

Smart contract auditors will likely comment on and discourage the usage of `block.timestamp`. This property is being used to calculate the time-dependent HDN rewards. Using `block.timestamp` is discouraged since it can be manipulated by powerful miners which could cause irreparable harm to the tokens; namely, draining the tokens of all their value. [Read more](https://ethereum.stackexchange.com/questions/413/can-a-contract-safely-rely-on-block-timestamp) about the security concern.

Generally speaking, for our use case, the impact is insignificant. If miners decide to manipulate the `block.timestamp` property, they are limited to choosing a marginal future timestamp, which only means all NFT owners would receive rewards sooner than expected. This would not negatively impact the economics of the reward system or the value of HDN.

Once a timestamp is chosen on a block, the next block cannot have an earlier timestamp. Therefore, there is no scenario where infinite rewards can be generated through any NFT.

If the auditor reveals a concern aside from what has been considered here, then the implementation can be changed to distribute rewards based on `block.number`. In that case, the team would need to estimate how many blocks will be generated between launch and the date reward emissions should end. Based on that calculation, x tokens/block can be calculated and implemented into the contract, replacing the `block.timestamp` implementation.

# 🏦 HDN Fungible Token

This is an ERC20 token with a limited supply of 50 billion

Technical Features

- limited supply
- access control
- allow distribution of HDN for rewards

## Proving the supply is limited

Originally, it was decided to mint all 50 billion tokens to the HDN ERC20 contract address itself from within the constructor. Since the `mint()` function is never called outside the constructor, this would be sufficient proof that HDN can no longer be minted and is therefore limited in its supply.

Since the Astronuts must have the ability to reward their owners with HDN, there must be some mechanism through which that can occur. Remember from the previous discussion on royalties, that only the owner of a token can `transfer()` its own tokens from one address to another. There is one way to allow another address to use your `transfer()` function, and that is with the `approve()` function. This method requires that an amount be specified, which ensures that the approved address is limited in what can transfer. Once an address is given an allowance, any amount, up to that allowed amount, can be sent either to itself or another address.

If all 50 billion tokens are minted to an address, then the `approve()` method must be incorporated into the process for giving a trusted address (like the Astronuts address) access to those funds for reward distribution.

Instead of minting all 50 billion tokens within the constructor, another approach can be taken using the ERC20Capped contract. The motivation behind using this extension from openzeppelin is because it removes the requirement of using the `approve()` method and allows the `mint()` function to be used in an access controlled function while still showing proof that the supply is limited. The ERC20Capped implements a blocker on the `mint()` function that stops it from being called when the total supply of tokens reaches the cap limit. This logic can bee seen in the ERC20Capped contract itself and that is all the proof required for demonstrating a limited supply.

## 🔒 Access Control for reward distribution

In order for an owner to collect their accrued rewards, the HDN tokens must transfer to the given owner's address either from a treasury address or be minted from the HDN fungible token smart contract. Regardless of where the tokens come from, the ability to perform this action must be limited to trusted parties and granted in a secure manner.

This can be done by checking what address is executing the transfer and limiting it to only hard-coded addresses that are trusted. This method requires some hard-coding of the trusted addresses, which may be sufficient for certain uses cases. However, for HDN, future NFT contracts are going to need this special permission, and those contracts will be deployed after the HDN smart contract. Therefore, HDN access control cannot be implemented through the use of hard-coded addresses.

Implementing access control can be done a number of ways. The standard practice is to use either the `Ownable` or `AccessControl` contracts (provided by openzeppelin). For maximum flexibility that will ease future NFT releases, `AccessControl` was chosen.

The only function that needs access control on the HDN smart contract is the `mint()` function. The power to mint HDN cannot be public. Therefore, the `TREASURY_ROLE` was created. This role is checked when the `mint()` function is called. If the address executing the function has not been granted this role, then the transaction will revert with an access control error.

Implementing the security of `mint()` this way is massively beneficial since it avoids having to define hard-coded address within the HDN smart contract itself. Instead, a role is defined on the smart contract and the logic checks whether that role has been granted to the address executing `mint()`. This allows for all the flexibility needed for the planned future NFT releases to distribute rewards through the HDN smart contract. When that NFT is released, it will be granted the `TREASURY_ROLE` as part of the deployment process.

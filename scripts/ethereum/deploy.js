const main = async () => {
  //deployContract('MyEpicNFT');
  deployContract('HDNYieldToNut');
  //mint(nftContract);
};

async function deployContract(id) {
  const contractFactory = await hre.ethers.getContractFactory(id);
  const contract = await contractFactory.deploy();
  await contract.deployed();
  console.log('Contract deployed to:', contract.address);
}

async function mint(nftContract) {
  // Call the function.
  let txn = await nftContract.makeAnEpicNFT();
  // Wait for it to be mined.
  await txn.wait();
  console.log('Minted NFT #1');

  txn = await nftContract.makeAnEpicNFT();
  await txn.wait();
  console.log('Minted NFT #2');

  txn = await nftContract.makeAnEpicNFT();
  await txn.wait();
  console.log('Minted NFT #3');
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();

import {
  shallPass,
  sendTransaction,
  getAccountAddress,
  deployContractByName,
} from "flow-js-testing";

const mint = async (owner, signer) => {
  // Deploy the contract from the owner
  const to = await getAccountAddress(owner);
  const name = "ExampleNFT";
  await deployContractByName({ to, name });

  const from = await getAccountAddress(signer);
  const code = `
      import ExampleNFT from ${owner}
      transaction {
          let receiverRef: &{ExampleNFT.NFTReceiver}
          let minterRef: &ExampleNFT.NFTMinter

          prepare(acct: AuthAccount) {
              self.receiverRef = acct.getCapability<&{ExampleNFT.NFTReceiver}>(/public/NFTReceiver).borrow()
                  ?? panic("Could not borrow receiver reference")
              self.minterRef = acct.borrow<&ExampleNFT.NFTMinter>(from: /storage/NFTMinter)
                  ?? panic("could not borrow minter reference")
          }

          execute {
              let newNFT <- self.minterRef.mintNFT()
              self.receiverRef.deposit(token: <-newNFT)
              log("NFT Minted and deposited to Account 2's Collection")
          }
      }
  `;

  // Create a new account from the given parameter
  const signers = [from];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    signers,
  });
};

export default mint;

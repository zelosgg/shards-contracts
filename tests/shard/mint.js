import {
  sendTransaction,
  getAccountAddress,
  deployContractByName,
  getContractAddress
} from "flow-js-testing";
import deployNonFungibleToken from './standard'

const mint = async (owner, signer) => {
  // Make sure the NFT contract is deployed first
  await deployNonFungibleToken()
  const NonFungibleToken = await getContractAddress("NonFungibleToken")

  // Deploy the Shard contract from the owner
  const name = "Shard";
  const addressMap = { NonFungibleToken }
  const from = await getAccountAddress(owner);
  const transaction = await deployContractByName({ name, addressMap, to: from })
  console.log(transaction)

  // The Cadence transaction code
  const mint = `
      import ${name} from ${from}
      transaction {
          let receiverRef: &{Shard.Collection}
          let minterRef: &Shard.NFTMinter

          prepare(acct: AuthAccount) {
              self.receiverRef = acct.getCapability<&{Shard.Collection}>(/public/ShardCollection).borrow()
                  ?? panic("Could not borrow receiver reference")
              self.minterRef = acct.borrow<&Shard.NFTMinter>(from: /storage/NFTMinter)
                  ?? panic("could not borrow minter reference")
          }

          execute {
              let newShard <- self.minterRef.mintShard()
              self.receiverRef.deposit(token: <-newShard)
              log("Sahrd Minted and deposited to Account 2's Collection")
          }
      }
  `;

  // Create a new account from the given signer parameter
  const to = await getAccountAddress(signer);
  const signers = [to];

  // Send the transaction and return the result
  return await sendTransaction({
    code: mint,
    signers,
  });
};

export default mint;

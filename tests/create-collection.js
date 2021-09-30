import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

// Initializes a new storage space for users to receive NFTs
const createCollection = async (signer) => {
  // Get the contract addresses
  const NonFungibleToken = await getContractAddress("NonFungibleToken");
  const Shard = await getContractAddress("Shard");

  // The Cadence transaction code
  const code = `
    import NonFungibleToken from ${NonFungibleToken}
    import Shard from ${Shard}
    transaction {
        prepare(acct: AuthAccount) {
            if acct.borrow<&Shard.Collection>(from: /storage/ShardCollection) != nil {
                return
            }
            let collection <- Shard.createEmptyCollection()
            acct.save(<-collection, to: /storage/ShardCollection)
            acct.link<&{NonFungibleToken.CollectionPublic}>(
                /public/ShardCollection,
                target: /storage/ShardCollection
            )
        }
    }
  `;

  // Create a new account from the given signer parameter
  const signers = [await getAccountAddress(signer)];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    signers,
  });
};

export default createCollection;

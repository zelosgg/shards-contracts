import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

// Initializes a new storage space for users to receive NFTs
const createCollection = async (...signers) => {
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

  for (const signer of signers) {
    // Send the transaction and return the result
    var tx = await sendTransaction({
      code,
      signers: [await getAccountAddress(signer)],
    });
  }

  // We need to return something for the unit test, so return the last tx
  return tx;
};

export default createCollection;

import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

// Initializes a new storage space for users to receive NFTs
const createCollection = async (...signers) => {
  // Get the contract addresses
  const Crystal = await getContractAddress("Crystal");

  // The Cadence transaction code
  const code = `
    import Crystal from ${Crystal}
    transaction {
        prepare(acct: AuthAccount) {
            if acct.borrow<&Crystal.Collection>(from: /storage/EternalCrystalCollection) != nil {
                return
            }
            let collection <- Crystal.createEmptyCollection()
            acct.save(<-collection, to: /storage/EternalCrystalCollection)
            acct.link<&{Crystal.CrystalCollectionPublic}>(
                /public/EternalCrystalCollection,
                target: /storage/EternalCrystalCollection
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

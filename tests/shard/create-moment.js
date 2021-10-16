import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

const createMoment = async (operator, influencerID, splits, metadataURI) => {
  // Get the contract addresses
  const Shard = await getContractAddress("Shard");

  // The Cadence transaction code
  const code = `
      import Shard from ${Shard}
      transaction(influencerID: String, splits: UInt8, metadata: {String: String}) {
          let minter: &Shard.Admin
          prepare(signer: AuthAccount) {
              self.minter = signer.borrow<&Shard.Admin>(from: /storage/EternalShardAdmin)
                  ?? panic("Could not borrow a reference to the Shard minter")
          }
          execute {
              self.minter.createMoment(influencerID: influencerID, splits: splits, metadata: metadata)
          }
      }
  `;

  // Check optional parameters
  if (influencerID === undefined) {
    influencerID = "Fake String";
  }
  if (splits === undefined) {
    splits = 5;
  }
  if (metadataURI === undefined) {
    metadataURI = "https://eternal.gg/metadata.json";
  }

  const args = [influencerID, splits, metadataURI];
  const signers = [await getAccountAddress(operator)];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    args,
    signers,
  });
};

export default createMoment;

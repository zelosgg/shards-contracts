import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

const createClip = async (operator, momentID, sequence, metadataURI) => {
  // Get the contract addresses
  const Shard = await getContractAddress("Shard");

  // The Cadence transaction code
  const code = `
      import Shard from ${Shard}
      transaction(momentID: UInt32, sequence: UInt8, metadata: {String: String}) {
          let minter: &Shard.Admin
          prepare(signer: AuthAccount) {
              self.minter = signer.borrow<&Shard.Admin>(from: /storage/EternalShardAdmin)
                  ?? panic("Could not borrow a reference to the Shard minter")
          }
          execute {
              self.minter.createClip(momentID: momentID, sequence: sequence, metadata: metadata)
          }
      }
  `;

  // Check optional parameters
  if (sequence === undefined) {
    sequence = Math.floor(Math.random() * 255);
  }
  if (metadataURI === undefined) {
    metadataURI = "https://eternal.gg/metadata.json";
  }

  const args = [momentID, sequence, metadataURI];
  const signers = [await getAccountAddress(operator)];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    args,
    signers,
  });
};

export default createClip;

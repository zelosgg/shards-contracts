import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

const mint = async (from, to, clipID) => {
  // Get the contract addresses
  const Shard = await getContractAddress("Shard");

  // The Cadence transaction code
  const code = `
    import Shard from ${Shard}
    transaction(recipient: Address, clipID: UInt32) {
        let minter: &Shard.Admin
        prepare(signer: AuthAccount) {
            self.minter = signer.borrow<&Shard.Admin>(from: /storage/EternalShardAdmin)
                ?? panic("Could not borrow a reference to the Shard minter")
        }
        execute {
            let receiver = getAccount(recipient)
                .getCapability(/public/EternalShardCollection)
                .borrow<&{Shard.ShardCollectionPublic}>()
                ?? panic("Could not get receiver reference to the Shard Collection")
            self.minter.mintNFT(recipient: receiver, clipID: clipID)
        }
    }
  `;

  // Create a new account from the given signer parameter
  const args = [await getAccountAddress(to), clipID];
  const signers = [await getAccountAddress(from)];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    args,
    signers,
  });
};

export default mint;

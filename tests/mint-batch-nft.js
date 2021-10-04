import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

const mintBatch = async (from, to, clipID, quantity) => {
  // Get the contract addresses
  const NonFungibleToken = await getContractAddress("NonFungibleToken");
  const Shard = await getContractAddress("Shard");

  // The Cadence transaction code
  const code = `
    import NonFungibleToken from ${NonFungibleToken}
    import Shard from ${Shard}
    transaction(recipient: Address, clipID: UInt32, quantity: UInt64) {
        let minter: &Shard.Admin
        prepare(signer: AuthAccount) {
            self.minter = signer.borrow<&Shard.Admin>(from: /storage/EternalShardAdmin)
                ?? panic("Could not borrow a reference to the Shard minter")
        }
        execute {
            let receiver = getAccount(recipient)
                .getCapability(/public/EternalShardCollection)
                .borrow<&{NonFungibleToken.CollectionPublic}>()
                ?? panic("Could not get receiver reference to the Shard collection")
            self.minter.batchMintNFT(recipient: receiver, clipID: clipID, quantity: quantity)
        }
    }
  `;

  // Create a new account from the given signer parameter
  if (quantity == undefined) {
    // Anything too big makes the transaction run out of gas
    quantity = Math.floor(Math.random() * 20);
  }
  const args = [await getAccountAddress(to), clipID, quantity];
  const signers = [await getAccountAddress(from)];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    args,
    signers,
  });
};

export default mintBatch;

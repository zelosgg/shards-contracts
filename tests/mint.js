import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
  mintFlow,
} from "flow-js-testing";
import createCollection from "./create-collection";

const mint = async (signer) => {
  // Create a collection for the signer
  await createCollection(signer);

  // Get the contract addresses
  const NonFungibleToken = await getContractAddress("NonFungibleToken");
  const Shard = await getContractAddress("Shard");

  // The Cadence transaction code
  const code = `
    import NonFungibleToken from ${NonFungibleToken}
    import Shard from ${Shard}
    transaction(recipient: Address, momentID: UInt64) {
        let minter: &Shard.ShardMinter
        prepare(signer: AuthAccount) {
            self.minter = signer.borrow<&Shard.ShardMinter>(from: /storage/ShardMinter)
                ?? panic("Could not borrow a reference to the Shard minter")
        }
        execute {
            let receiver = getAccount(recipient)
                .getCapability(/public/ShardCollection)
                .borrow<&{NonFungibleToken.CollectionPublic}>()
                ?? panic("Could not get receiver reference to the Shard Collection")
            self.minter.mintNFT(recipient: receiver, momentID: momentID)
        }
    }
  `;

  // Create a new account from the given signer parameter
  const signerAddress = await getAccountAddress(signer)
  const momentID = 33
  const args = [signerAddress, momentID];
  const signers = [signerAddress];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    args,
    signers,
  });
};

export default mint;

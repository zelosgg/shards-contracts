import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
  mintFlow
} from "flow-js-testing";
import createCollection from "./create-collection";

const mint = async (signer) => {
  // Create a collection for the signer
  await createCollection(signer)

  // The account holder must have flow before receiving NFTs
  await mintFlow(await getAccountAddress(signer), "0.1")

  // Get the contract addresses
  const NonFungibleToken = await getContractAddress("NonFungibleToken");
  const Shard = await getContractAddress("Shard");

  // The Cadence transaction code
  const code = `
    import NonFungibleToken from ${NonFungibleToken}
    import Shard from ${Shard}
    transaction(recipient: Address) {
        let minter: &Shard.NFTMinter
        prepare(signer: AuthAccount) {
            self.minter = signer.borrow<&Shard.NFTMinter>(from: /storage/NFTMinter)
                ?? panic("Could not borrow a reference to the NFT minter")
        }
        execute {
            let receiver = getAccount(recipient)
                .getCapability(/public/NFTCollection)
                .borrow<&{NonFungibleToken.CollectionPublic}>()
                ?? panic("Could not get receiver reference to the NFT Collection")
            self.minter.mintNFT(recipient: receiver)
        }
    }
  `;

  // Create a new account from the given signer parameter
  signer = await getAccountAddress(signer)
  const args = [signer];
  const signers = [signer];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    args,
    signers,
  });
};

export default mint;

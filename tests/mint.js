import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

const mint = async (from, to) => {
  // Get the contract addresses
  const NonFungibleToken = await getContractAddress("NonFungibleToken");
  const Shard = await getContractAddress("Shard");

  // The Cadence transaction code
  const code = `
    import NonFungibleToken from ${NonFungibleToken}
    import Shard from ${Shard}
    transaction(
        recipient: Address,
        momentID: UInt64,
        sequence: UInt8,
        metadataURI: {String: String}
    ) {
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
            self.minter.mintNFT(
                recipient: receiver,
                momentID: momentID,
                sequence: Shard.Sequence(rawValue: sequence)!,
                metadata: metadataURI
            )
        }
    }
  `;

  // Create a new account from the given signer parameter
  const momentID = Math.floor(Math.random() * 18446744073709551615)
  const sequence = Math.floor(Math.random() * 3)
  const metadataURI = "https://eternal.gg/metadata.json"
  const args = [await getAccountAddress(to), momentID, sequence, metadataURI];
  const signers = [await getAccountAddress(from)];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    args,
    signers,
  });
};

export default mint;

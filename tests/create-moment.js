import {
    sendTransaction,
    getAccountAddress,
    getContractAddress,
} from "flow-js-testing";

const createMoment = async (operator) => {
    // Get the contract addresses
    const NonFungibleToken = await getContractAddress("NonFungibleToken");
    const Shard = await getContractAddress("Shard");

    // The Cadence transaction code
    const code = `
    import NonFungibleToken from ${NonFungibleToken}
    import Shard from ${Shard}
    transaction(creatorID: UInt32, sequence: UInt8, metadata: {String: String}) {
        let minter: &Shard.Admin
        prepare(signer: AuthAccount) {
            self.minter = signer.borrow<&Shard.Admin>(from: /storage/ShardAdmin)
                ?? panic("Could not borrow a reference to the Shard minter")
        }
        execute {
            let seq = Shard.Sequence(rawValue: sequence)!
            self.minter.createMoment(creatorID: creatorID, sequence: seq, metadata: metadata)
        }
    }
  `;

    // Create a new account from the given signer parameter
    const momentID = Math.floor(Math.random() * 4294967295);
    const sequence = Math.floor(Math.random() * 3);
    const metadataURI = "https://eternal.gg/metadata.json";
    const args = [momentID, sequence, metadataURI];
    const signers = [await getAccountAddress(operator)];

    // Send the transaction and return the result
    return await sendTransaction({
        code,
        args,
        signers,
    });
};

export default createMoment;
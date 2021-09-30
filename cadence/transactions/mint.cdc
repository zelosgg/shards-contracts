import NonFungibleToken from 0xNonFungibleToken
import Shard from 0xShard

// This script uses the NFTMinter resource to mint a new NFT
// It must be run with the account that has the minter resource
// stored in /storage/NFTMinter

transaction(recipient: Address, momentID: UInt64, sequence: Shard.Sequence) {
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
        self.minter.mintNFT(recipient: receiver, momentID: momentID, sequence: sequence)
    }
}

import NonFungibleToken from 0xNonFungibleToken
import Shard from 0xShard

// This script uses the Shard.Admin resource to mint a batch of new NFTs
// The sender is required to be a Shard Admin

transaction(recipient: Address, clipID: UInt32, quantity: UInt64) {
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
        self.minter.batchMintNFT(recipient: receiver, clipID: clipID, quantity: quantity)
    }
}

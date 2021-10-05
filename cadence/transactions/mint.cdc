import Shard from 0xShard

// This script uses the NFTMinter resource to mint a new NFT
// It must be run with the account that has the minter resource
// stored in /storage/NFTMinter

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

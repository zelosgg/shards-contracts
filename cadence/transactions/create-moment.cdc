import Shard from 0xShard

// Create a moment with given parameters
// The sender is required to be a Shard Admin

transaction(creatorID: String, metadata: {String: String}) {
    let minter: &Shard.Admin
    prepare(signer: AuthAccount) {
        self.minter = signer.borrow<&Shard.Admin>(from: /storage/ShardAdmin)
            ?? panic("Could not borrow a reference to the Shard minter")
    }
    execute {
        self.minter.createMoment(creatorID: creatorID, metadata: metadata)
    }
}

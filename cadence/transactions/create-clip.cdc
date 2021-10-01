import NonFungibleToken from 0xNonFungibleToken
import Shard from 0xShard

// Create a moment with given parameters
// The sender is required to be a Shard Admin

transaction(momentID: UInt32, sequence: UInt8, metadata: {String: String}) {
    let minter: &Shard.Admin
    prepare(signer: AuthAccount) {
        self.minter = signer.borrow<&Shard.Admin>(from: /storage/ShardAdmin)
            ?? panic("Could not borrow a reference to the Shard minter")
    }
    execute {
        let seq = Shard.Sequence(rawValue: sequence)!
        self.minter.createClip(momentID: momentID, sequence: seq, metadata: metadata)
    }
}

import Shard from 0xShard

// This script airdrops shards to a list of users

transaction(recipients: [Address], clipIDs: [UInt32]) {
    let minter: &Shard.Admin

    prepare(signer: AuthAccount) {
        self.minter = signer.borrow<&Shard.Admin>(from: /storage/EternalShardAdmin)
            ?? panic("Could not borrow a reference to the Shard minter")
    }

    pre {
        recipients.length == clipIDs.length : "Recipients and Clip IDs lengths must match"
    }

    execute {
        var index = 0
        while index < recipients.length {
            let receiver = getAccount(recipients[index])
                .getCapability(/public/EternalShardCollection)
                .borrow<&{Shard.ShardCollectionPublic}>()
                ?? panic("Could not get receiver reference to the Shard Collection")
            self.minter.mintNFT(recipient: receiver, clipID: clipIDs[index])
            index = index + 1
        }
    }
}

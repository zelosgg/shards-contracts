import Shard from 0xShard

// This transaction is what an account would run
// to set itself up to receive NFTs

transaction {
    prepare(acct: AuthAccount) {
        if acct.borrow<&Shard.Collection>(from: /storage/EternalShardCollection) != nil {
            return
        }
        let collection <- Shard.createEmptyCollection()
        acct.save(<-collection, to: /storage/EternalShardCollection)
        acct.link<&{Shard.ShardCollectionPublic}>(
            /public/EternalShardCollection,
            target: /storage/EternalShardCollection
        )
    }
}

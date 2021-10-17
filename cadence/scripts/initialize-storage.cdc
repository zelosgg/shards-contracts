import NonFungibleToken from 0xNonFungibleToken
import Shard from 0xShard
transaction {
    prepare(acct: AuthAccount) {
        if acct.borrow<&Shard.Collection>(from: /storage/EternalShardCollection) == nil {
            let collection <- Shard.createEmptyCollection()
            acct.save(<-collection, to: /storage/EternalShardCollection)
            acct.link<&{Shard.ShardCollectionPublic}>(
                /public/EternalShardCollection,
                target: /storage/EternalShardCollection
            )
        }
    }
}


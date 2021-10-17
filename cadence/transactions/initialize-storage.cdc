// import NonFungibleToken from 0xNonFungibleToken
// import Shard from 0xShard
import NonFungibleToken from 0x631e88ae7f1d7c20
import Shard from 0x30b0d80610989b9f
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


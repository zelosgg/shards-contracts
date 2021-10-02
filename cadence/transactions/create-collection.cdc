import NonFungibleToken from 0xNonFungibleToken
import Shard from 0xShard

// This transaction is what an account would run
// to set itself up to receive NFTs

transaction {
    prepare(acct: AuthAccount) {
        if acct.borrow<&Shard.Collection>(from: /storage/ShardCollection) != nil {
            return
        }
        let collection <- Shard.createEmptyCollection()
        acct.save(<-collection, to: /storage/ShardCollection)
        acct.link<&{NonFungibleToken.CollectionPublic}>(
            /public/ShardCollection,
            target: /storage/ShardCollection
        )
    }
}

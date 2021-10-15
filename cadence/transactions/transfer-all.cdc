import NonFungibleToken from 0xNonFungibleToken
import Shard from 0xShard

// This transaction is for batch transfering all NFTs

transaction(receiver: Address) {
    let collectionRef: &Shard.Collection
    let depositRef: &AnyResource{Shard.ShardCollectionPublic}

    prepare(acct: AuthAccount) {
        let recipient = getAccount(receiver)
        self.collectionRef = acct.borrow<&Shard.Collection>(from: /storage/EternalShardCollection)
            ?? panic("Could not borrow a reference to the owner's collection")
        self.depositRef = recipient.getCapability<&{Shard.ShardCollectionPublic}>(/public/EternalShardCollection)
            .borrow()
            ?? panic("Could not borrow a reference to the receiver's collection")
    }

    execute {
        let ids = self.collectionRef.getIDs()
        for id in ids {
            let nft <- self.collectionRef.withdraw(withdrawID: id)
            self.depositRef.deposit(token: <-nft)
        }
    }
}
import NonFungibleToken from 0xNonFungibleToken
import Shard from 0xShard

// This transaction is for transferring and NFT from
// one account to another

transaction(recipient: Address, withdrawID: UInt64) {
    prepare(acct: AuthAccount) {
        let recipient = getAccount(recipient)
        let collectionRef = acct.borrow<&Shard.Collection>(from: /storage/ShardCollection)
            ?? panic("Could not borrow a reference to the owner's collection")
        let depositRef = recipient.getCapability(/public/ShardCollection)
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not borrow a reference to the receiver's collection")
        let nft <- collectionRef.withdraw(withdrawID: withdrawID)
        depositRef.deposit(token: <-nft)
    }
}

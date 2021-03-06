// import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
// import Shard from "../contracts/Shard.cdc"
// import Crystal from "../contracts/Crystal.cdc"
import NonFungibleToken from 0x631e88ae7f1d7c20
import Shard from 0x30b0d80610989b9f
import Crystal from 0x56b018f9f37217d6
transaction(recipient: Address, shardIDs: [UInt64]) {
    let shardCollection: &Shard.Collection
    prepare(signer: AuthAccount) {
        self.shardCollection = signer.borrow<&Shard.Collection>(from: /storage/EternalShardCollection)
            ?? panic("Could not borrow a reference to the signer's Shard collection")
    }
    execute {
        let receiver = getAccount(recipient)
            .getCapability(/public/EternalCrystalCollection)
            .borrow<&{Crystal.CrystalCollectionPublic}>()
            ?? panic("Could not borrow a reference to the receiver's Crystal collection")
        var shards: @[Shard.NFT] <- []
        for shardID in shardIDs {
            shards.append(<-(self.shardCollection.withdraw(withdrawID: shardID) as! @Shard.NFT))
        }
        receiver.deposit(token: <-Crystal.merge(shards: <-shards)!)
    }
}
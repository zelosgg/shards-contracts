import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import Shard from "../contracts/Shard.cdc"
import Crystal from "../contracts/Crystal.cdc"

pub fun main(receiver: Address, id: UInt64): UInt8 {
    let collection = getAccount(receiver)
        .getCapability(/public/EternalShardCollection)
        .borrow<&{Shard.ShardCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Shard Collection")
    let shard = collection.borrowShardNFT(id: id)!
    return Crystal.getShardSplits(shard: shard)
}

// import Shard from 0xShard
import Shard from 0x30b0d80610989b9f // testnet
pub fun main(owner: Address): [UInt64] {
    let collection = getAccount(owner)
        .getCapability(/public/EternalShardCollection)
        .borrow<&{Shard.ShardCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Shard Collection")
    return collection.getIDs()
}

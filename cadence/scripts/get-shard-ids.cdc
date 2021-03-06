// import Shard from 0xShard
// import Shard from 0x30b0d80610989b9f // testnet
import Shard from 0x82b54037a8f180cf // mainnet
pub fun main(owner: Address): [UInt64] {
    let collection = getAccount(owner)
        .getCapability(/public/EternalShardCollection)
        .borrow<&{Shard.ShardCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Shard Collection")
    return collection.getIDs()
}

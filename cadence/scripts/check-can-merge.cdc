import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import Shard from "../contracts/Shard.cdc"
import Crystal from "../contracts/Crystal.cdc"

pub fun main(owner: Address, ids: [UInt64]): Bool {
    let shards: [&Shard.NFT] = Crystal.getShardsByIDs(owner: owner, ids: ids)
    return Crystal.checkCanMerge(shards: shards)
}
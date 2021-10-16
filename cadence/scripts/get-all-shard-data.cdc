import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import Shard from "../contracts/Shard.cdc"

pub fun main(receiver: Address): [AnyStruct] {
    let collection = getAccount(receiver)
        .getCapability(/public/EternalShardCollection)
        .borrow<&{Shard.ShardCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Shard Collection")
    let allTokens: [AnyStruct] = []
    let ids = collection.getIDs()
    for id in ids {
        let tokenData: [AnyStruct] = []
        let nft = collection.borrowShardNFT(id: id)!
        let clip = Shard.getClip(clipID: nft.clipID)!
        let clipMetadata = Shard.getClipMetadata(clipID: clip.id)!
        let moment = Shard.getMoment(momentID: clip.momentID)!
        let momentMetadata = Shard.getMomentMetadata(momentID: moment.id)!
        tokenData.append(id)
        tokenData.append(collection.borrowNFT(id: id).uuid)
        for cd in clipMetadata.values {
            tokenData.append(cd)
        }
        for md in momentMetadata.values {
            tokenData.append(momentMetadata.values)
        }
        allTokens.append(tokenData)
    }
    return allTokens
}

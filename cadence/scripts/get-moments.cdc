import Eternal from 0xEternal
pub fun main(owner: Address): [UInt64] {
    let collection = getAccount(owner)
        .getCapability(/public/EternalMomentCollection)
        .borrow<&{Eternal.MomentCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Moment Collection")
    return collection.getIDs()
}

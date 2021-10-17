import Crystal from 0xCrystal

// This script uses the Crystal.Admin resource to mint a batch of new NFTs
// The sender is required to be a Crystal Admin

transaction(recipient: Address, clipID: UInt32, quantity: UInt64) {
    let minter: &Crystal.Admin
    prepare(signer: AuthAccount) {
        self.minter = signer.borrow<&Crystal.Admin>(from: /storage/EternalCrystalAdmin)
            ?? panic("Could not borrow a reference to the Crystal minter")
    }
    execute {
        let receiver = getAccount(recipient)
            .getCapability(/public/EternalCrystalCollection)
            .borrow<&{Crystal.CrystalCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Crystal Collection")
        self.minter.batchMintNFT(recipient: receiver, clipID: clipID, quantity: quantity)
    }
}

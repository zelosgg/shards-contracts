import NonFungibleToken from "./NonFungibleToken.cdc"
import Shard from "./Shard.cdc"

// eternal.gg
pub contract Crystal: NonFungibleToken {
    // Total amount of Crystals that have been minted
    pub var totalSupply: UInt64

    // Events
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event CrystalMinted(
        id: UInt64,
        shardIDs: [UInt64],
        clipIDs: [UInt32],
        momentIDs: [UInt32],
        purity: UInt16
    )

    pub struct ShardData {
        // The unique ID of the Moment
        pub let id: UInt64

        // The influencer that the Moment belongs to
        pub let clip: Shard.Clip

        // The amount of Clips the Moments splits into
        pub let moment: Shard.Moment

        init(shard: &Shard.NFT) {
            self.id = shard.id
            self.clip = Shard.getClip(clipID: shard.clipID)!
            self.moment = Shard.getMoment(momentID: self.clip.momentID)!
        }
    }

    // Interface for a Collection
    pub resource interface CrystalCollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrowCrystalNFT(id: UInt64): &Crystal.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow Crystal reference: The ID of the returned reference is incorrect"
            }
        }
    }

    // NFT Representng a Crystal
    pub resource NFT: NonFungibleToken.INFT {
        // Identifier of NFT
        pub let id: UInt64

        // Purity of the Crystal
        pub let purity: UInt16

        init(
            initID: UInt64,
            shards: [&Shard.NFT],
            purity: UInt16)
        {
            self.id = initID
            self.purity = purity

            // Increase the total supply counter
            Crystal.totalSupply = Crystal.totalSupply + (1 as UInt64)

            // Gets shard data for use in event emit
            var shardIDs: [UInt64] = []
            var clipIDs: [UInt32] = []
            var momentIDs: [UInt32] = []

            for shard in shards {
                let shardData = Crystal.ShardData(shard)
                shardIDs.append(shardData.id)
                clipIDs.append(shardData.clip.id)
                momentIDs.append(shardData.moment.id)
            }

            emit CrystalMinted(
                id: self.id,
                shardIDs: shardIDs,
                clipIDs: clipIDs,
                momentIDs: momentIDs,
                purity: self.purity
            )
        }
    }

    pub resource Collection:
        CrystalCollectionPublic,
        NonFungibleToken.Provider,
        NonFungibleToken.Receiver,
        NonFungibleToken.CollectionPublic
    {
        // A resource type with an `UInt64` ID field
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        // Removes an NFT from the collection and moves it to the caller
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("The Crystal NFT does not exist")

            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        // Takes a NFT and adds it to the collections dictionary and adds the ID to the id array
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @Crystal.NFT
            let id: UInt64 = token.id

            // Add the new token to the dictionary which removes the old one
            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        // Returns an array of the IDs that are in the collection
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        // Gets a reference to a basic NFT in the collection
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        // Gets a reference to the Crystal NFT for metadata and such
        pub fun borrowCrystalNFT(id: UInt64): &Crystal.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
                return ref as! &Crystal.NFT
            } else {
                return nil
            }
        }

        init () {
            self.ownedNFTs <- {}
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    // A special authorization resource with administrative functions
    pub resource Admin {
        // Mints a new NFT with a new ID
        pub fun mintNFT(
            recipient: &{Crystal.CrystalCollectionPublic},
            shards: [&Shard.NFT]
            purity: UInt16
        ) {
            // Creates a new NFT with provided arguments
            var newNFT <- create NFT(
                initID: Crystal.totalSupply,
                shards: shards,
                purity: purity
            )

            // Deposits it in the recipient's account using their reference
            recipient.deposit(token: <-newNFT)
        }

        // Creates a new Admin resource to be given to an account
        pub fun createNewAdmin(): @Admin {
            return <-create Admin()
        }
    }

    // Public function that anyone can call to create a new empty collection
    pub fun createEmptyCollection(): @Crystal.Collection {
        return <- create Collection()
    }

    // Provided a list of IDs, returns the Shard NFT references
    pub fun getShardsByIDs(owner: Address, ids: [UInt64]): [&Shard.NFT] {
        pre {
            ids.length > 0: "No Shard IDs supplied"
        }

        // Access the collection of the owner
        let collection = getAccount(owner)
            .getCapability(/public/EternalShardCollection)
            .borrow<&{Shard.ShardCollectionPublic}>()
                ?? panic("Could not get receiver reference to the Shard Collection")

        // Create a list of Shards for every ID supplied
        let shards: [&Shard.NFT] = []
        for id in ids {
            let shard = collection.borrowShardNFT(id: id)!
            shards.append(shard)
        }

        return shards
    }

    // Provided a Shard, returns the splits property of the Shard
    pub fun getShardSplits(shard: &Shard.NFT): UInt8 {
        let shardData = Crystal.ShardData(shard)
        var splits = shardData.moment.splits

        return splits
    }

    // Provided a list of Shard references, returns true if they can merge, false if not
    pub fun checkCanMerge(shards: [&Shard.NFT]): Bool {
        pre {
            shards.length > 0: "No Shards supplied"
        }

        let uniques: [&Shard.NFT] = []
        let initialSplits = Crystal.getShardSplits(shard: shards[0])
        for shard in shards {
            let splits = Crystal.getShardSplits(shard: shard)
            // 1. Make sure the sequence of each Shard matches
            // 2. Make sure there are enough Shards to merge
            // 3. Make sure there are no duplicates
            if splits != initialSplits
                || UInt8(shards.length) != splits
                || uniques.contains(shard)
            {
                return false
            }

            // Append the Shard to the unique array
            uniques.append(shard)
        }

        // If the for loop exited without returning, all sequence lengths match
        return true
    }

    // Provided a Shard reference, returns the calculated purity of the Shard
    pub fun getPurity(shards: [&Shard.NFT]): UInt16 {
        pre {
            // Make sure the sequence of each Shard matches
            Crystal.checkCanMerge(shards: shards): "Shards must all have the same sequence length"
        }

        var purity: UInt16 = 0
        var uniqueSequences: [UInt8] = []

        // Add the unique sequence for the first Shard
        uniqueSequences.append(Shard.getClip(clipID: shards[0].clipID)!.sequence)

        while shards.length > 0 {
            // Remove the Shard and save it for comparison
            let shard = Crystal.ShardData(shards.removeFirst())

            // Iterate over the array once again for comparison
            for comparisonShard in shards {
                let comparison = Crystal.ShardData(comparisonShard)

                if shard.moment.influencerID == comparison.moment.influencerID {
                    // Increase purity for having the same influencer
                    purity = purity + 10
                    if shard.moment.id == comparison.moment.id {
                        // Increase purity for having the same moment
                        purity = purity + 10
                        if shard.clip.id == comparison.clip.id {
                            // Increase purity if clips match
                            purity = purity + 10
                        } else {
                            // Increase purity if clip sequences are different
                            if !uniqueSequences.contains(comparison.clip.sequence) {
                                purity = purity + 20
                                uniqueSequences.append(comparison.clip.sequence)
                            }
                        }
                    }
                }
            }
        }

        return purity
    }

    // Merge multiple Shard NFTs to receive a Crystal NFT
    pub fun merge(shards: @[Shard.NFT]): @Crystal.NFT? {
        // Iterate resources to get an array of Shard references
        var i = 0
        var shardReferences: [&Shard.NFT] = []
        while i < shards.length {
            let shard: &Shard.NFT = &shards[i] as &Shard.NFT
            shardReferences.append(shard)
            i = i + 1
        }

        // Get the purity
        let purity: UInt16 = Crystal.getPurity(shards: shardReferences)

        // Create a new Crystal with calculated purity and destroy the Shards
        let crystal: @Crystal.NFT <- create NFT(
            initID: Crystal.totalSupply,
            shards: shardReferences,
            purity: purity
        )
        destroy shards
        return <- crystal
    }

    init() {
        // Initialize the total supply
        self.totalSupply = 1

        // Create a Collection resource and save it to storage
        self.account.save(<-create Collection(), to: /storage/EternalCrystalCollection)

        // Create an Admin resource and save it to storage
        self.account.save(<- create Admin(), to: /storage/EternalCrystalAdmin)

        // Create a public capability for the collection
        self.account.link<&{Crystal.CrystalCollectionPublic}>(
            /public/EternalCrystalCollection,
            target: /storage/EternalCrystalCollection
        )

        emit ContractInitialized()
    }
}

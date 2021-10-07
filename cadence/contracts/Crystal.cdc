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
    pub event CrystalMinted(id: UInt64)

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

        init(initID: UInt64) {
            self.id = initID

            // Increase the total supply counter
            Crystal.totalSupply = Crystal.totalSupply + (1 as UInt64)

            emit CrystalMinted(id: self.id)
        }
    }

    pub resource Collection: CrystalCollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
        // A resource type with an `UInt64` ID field
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        // Removes an NFT from the collection and moves it to the caller
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

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
            clipID: UInt32
        ) {
            // Creates a new NFT with provided arguments
            var newNFT <- create NFT(
                initID: Crystal.totalSupply
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

    pub fun getShardSplits(shard: &Shard.NFT): UInt8 {
        let clip = Shard.getClip(clipID: shard.clipID)!
        let moment = Shard.getMoment(momentID: clip.momentID)!
        var splits = moment.splits

        return splits
    }

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
            if splits != initialSplits || UInt8(shards.length) != splits || uniques.contains(shard) {
                return false
            }

            // Append the Shard to the unique array
            uniques.append(shard)
        }

        // If the for loop exited without returning, all sequence lengths match
        return true
    }

    // Merge multiple Shard NFTs to receive a Crystal NFT
    pub fun merge(shards: [&Shard.NFT]): @Crystal.NFT? {
        pre {
            // Make sure the sequence of each Shard matches
            Crystal.checkCanMerge(shards: shards): "Shards must all have the same sequence length"
        }

        return nil
    }

    init() {
        // Initialize the total supply
        self.totalSupply = 0

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

import Shard from "./Shard.cdc"

pub contract Crystal {
    // Declare the NFT resource type
    pub resource NFT {
        // The unique ID that differentiates each Crystal
        pub let id: UInt64

        // The moment that the Crystal belongs to
        pub let shards: [Shard]

        // Initialize the field in the init function
        init(tokenID: UInt64) {
            self.id = tokenID
            self.shards = []
        }
    }

    // An public interface for Crystals
    pub resource interface CrystalReceiver {
        pub fun deposit(token: @NFT)
        pub fun getIDs(): [UInt64]
        pub fun idExists(id: UInt64): Bool
    }

    // The definition of the Collection resource that
    // holds the Crystals that a user owns
    pub resource Collection: CrystalReceiver {
        // Dictionary of Crystal conforming tokens
        // Crystal is a resource type with an `UInt64` ID field
        pub var ownedCrystals: @{UInt64: NFT}

        // Initialize the Crystals field to an empty collection
        init () {
            self.ownedCrystals <- {}
        }

        // Function that removes an Crystal from the collection
        // and moves it to the calling context
        pub fun withdraw(withdrawID: UInt64): @NFT {
            // If the Crystal isn't found, the transaction panics and reverts
            let token <- self.ownedCrystals.remove(key: withdrawID)!

            return <-token
        }

        // Function that takes a Crystal as an argument and
        // adds it to the collections dictionary
        pub fun deposit(token: @NFT) {
            // Add the new token to the dictionary with a force assignment
            self.ownedCrystals[token.id] <-! token
        }

        // Checks to see if a Crystal with the given ID exists in the collection
        pub fun idExists(id: UInt64): Bool {
            return self.ownedCrystals[id] != nil
        }

        // Returns an array of the IDs that are in the collection
        pub fun getIDs(): [UInt64] {
            return self.ownedCrystals.keys
        }

        destroy() {
            destroy self.ownedCrystals
        }
    }

    // Creates a new empty Collection resource and returns it
    pub fun createEmptyCollection(): @Collection {
        return <- create Collection()
    }

    init() {
        // Store an empty Crystal Collection in account storage
        self.account.save(<-self.createEmptyCollection(), to: /storage/CrystalCollection)

        // Publish a reference to the Collection in storage
        self.account.link<&{CrystalReceiver}>(/public/CrystalReceiver, target: /storage/CrystalCollection)
    }
}

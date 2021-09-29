pub contract Shard {
    // Declare the NFT resource type
    pub resource NFT {
        // The unique ID that differentiates each Shard
        pub let id: UInt64

        // The moment that the Shard belongs to
        pub let momentID: UInt64

        // The sequence in the moment (1/2/3)
        pub let sequence: UInt8

        // Initialize the field in the init function
        init(tokenID: UInt64, momentID: UInt64, sequence: UInt8) {
            self.id = tokenID
            self.momentID = momentID
            self.sequence = sequence
        }
    }

    // An public interface for Shards
    pub resource interface ShardReceiver {
        pub fun deposit(token: @NFT)
        pub fun getIDs(): [UInt64]
        pub fun idExists(id: UInt64): Bool
    }

    // The definition of the Collection resource that
    // holds the Shards that a user owns
    pub resource Collection: ShardReceiver {
        // Dictionary of Shard conforming tokens
        // Shard is a resource type with an `UInt64` ID field
        pub var ownedShards: @{UInt64: NFT}

        // Initialize the Shards field to an empty collection
        init () {
            self.ownedShards <- {}
        }

        // Function that removes an Shard from the collection
        // and moves it to the calling context
        pub fun withdraw(withdrawID: UInt64): @NFT {
            // If the Shard isn't found, the transaction panics and reverts
            let token <- self.ownedShards.remove(key: withdrawID)!

            return <-token
        }

        // Function that takes a Shard as an argument and
        // adds it to the collections dictionary
        pub fun deposit(token: @NFT) {
            // Add the new token to the dictionary with a force assignment
            self.ownedShards[token.id] <-! token
        }

        // Checks to see if a Shard with the given ID exists in the collection
        pub fun idExists(id: UInt64): Bool {
            return self.ownedShards[id] != nil
        }

        // Returns an array of the IDs that are in the collection
        pub fun getIDs(): [UInt64] {
            return self.ownedShards.keys
        }

        destroy() {
            destroy self.ownedShards
        }
    }

    // Creates a new empty Collection resource and returns it
    pub fun createEmptyCollection(): @Collection {
        return <- create Collection()
    }

    // Resource that would be owned by an admin or by a smart contract
    // that allows them to mint new Shards when needed
    pub resource ShardMinter {
        // Incremented for every new shard
        pub var idCount: UInt64

        init() {
            self.idCount = 1
        }

        // Function that mints a new Shard with a new ID
        // and returns it to the caller
        pub fun mintShard(): @NFT {
            // Create a new Shard
            var newShard <- create NFT(
                tokenID: self.idCount,
                momentID: self.idCount,
                sequence: 1
            )

            // Change the id so that each ID is unique
            self.idCount = self.idCount + 1 as UInt64

            return <-newShard
        }
    }

    init() {
        // Store an empty Shard Collection in account storage
        self.account.save(<-self.createEmptyCollection(), to: /storage/ShardCollection)

        // Publish a reference to the Collection in storage
        self.account.link<&{ShardReceiver}>(/public/ShardReceiver, target: /storage/ShardCollection)

        // Store a minter resource in account storage
        self.account.save(<-create ShardMinter(), to: /storage/ShardMinter)
    }
}

import NonFungibleToken from 0xNonFungibleToken

// eternal.gg
pub contract Shard: NonFungibleToken {
    // Total amount of Shards that have been minted
    pub var totalSupply: UInt64

    // Total amount of Moments that have been minted
    pub var totalMoments: UInt32

    // Variable size dictionary of Moment structs
    access(self) var moments: {UInt32: Moment}

    // Events
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)

    // Structure defining the portion of a moment
    pub enum Sequence: UInt8 {
        pub case beginning
        pub case middle
        pub case end
    }

    pub struct Moment {
        // The unique ID for the Moment
        pub let id: UInt32

        // Represents the creator of the Moment
        pub let creatorID: UInt32

        // The sequence of the provided moment
        pub let sequence: Sequence

        // Stores all the metadata about the play as a string mapping
        pub let metadata: {String: String}

        init(creatorID: UInt32, sequence: Sequence, metadata: {String: String}) {
            pre {
                metadata.length > 0: "Metadata cannot be empty"
            }

            self.id = Shard.totalMoments
            self.creatorID = creatorID
            self.sequence = sequence
            self.metadata = metadata

            // Increment the ID so that it isn't used again
            Shard.totalMoments = Shard.totalMoments + (1 as UInt32)
        }
    }

    pub resource NFT: NonFungibleToken.INFT {
        // Identifier of NFT
        pub let id: UInt64

        // Moment ID corresponding to the Shard
        pub let momentID: UInt64

        init(
            initID: UInt64,
            momentID: UInt64,
        ) {
            self.id = initID
            self.momentID = momentID
        }
    }

    pub resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
        // A resource type with an `UInt64` ID field
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        init () {
            self.ownedNFTs <- {}
        }

        // Removes an NFT from the collection and moves it to the caller
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        // Takes a NFT and adds it to the collections dictionary and adds the ID to the id array
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @Shard.NFT
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

        // Gets a reference to an NFT in the collection
        // so that the caller can read its metadata and call its methods
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    // Admin is a special authorization resource that allows the owner to perform important functions
    pub resource Admin {
        // Creates a new Moment struct and returns the ID
        pub fun createMoment(creatorID: UInt32, sequence: Sequence, metadata: {String: String}): UInt32 {
            // Create the new Play
            var newMoment = Moment(creatorID: creatorID, sequence: sequence, metadata: metadata)
            let newID = newMoment.id

            // Store it in the contract storage
            Shard.moments[newID] = newMoment

            return newID
        }

        // Mints a new NFT with a new ID
        pub fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            momentID: UInt64,
        ) {
            // Creates a new NFT with provided arguments
            var newNFT <- create NFT(
                initID: Shard.totalSupply,
                momentID: momentID
            )

            // Deposits it in the recipient's account using their reference
            recipient.deposit(token: <-newNFT)

            // Increase the total supply counter
            Shard.totalSupply = Shard.totalSupply + (1 as UInt64)
        }

        // Creates a new Admin resource to be given to an account
        pub fun createNewAdmin(): @Admin {
            return <-create Admin()
        }
    }

    // Public function that anyone can call to create a new empty collection
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    // Publicly get metadata for a given moment ID
    pub fun getPlayMetadata(momentID: UInt32): {String: String}? {
        return self.moments[momentID]?.metadata
    }

    // Publicly get all Moments
    pub fun getAllMoments(): [Shard.Moment] {
        return Shard.moments.values
    }

    init() {
        // Initialize the total supply
        self.totalSupply = 0
        self.totalMoments = 0

        // Initialize with an empty set of moments
        self.moments = {}

        // Create a Collection resource and save it to storage
        let collection <- create Collection()
        self.account.save(<-collection, to: /storage/ShardCollection)

        // Create an Admin resource and save it to storage
        let admin <- create Admin()
        self.account.save(<-admin, to: /storage/ShardAdmin)

        // Create a public capability for the collection
        self.account.link<&{NonFungibleToken.CollectionPublic}>(
            /public/ShardCollection,
            target: /storage/ShardCollection
        )

        emit ContractInitialized()
    }
}

import NonFungibleToken from 0xNonFungibleToken

// eternal.gg
pub contract Shard: NonFungibleToken {
    // Total amount of Shards that have been minted
    pub var totalSupply: UInt64

    // Total amount of Clips that have been minted
    pub var totalClips: UInt32

    // Variable size dictionary of Clip structs
    access(self) var clips: {UInt32: Clip}

    // Events
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event ShardCreated(id: UInt32, creatorID: UInt32, sequence: UInt8, metadata: {String: String})
    pub event ShardMinted(id: UInt64, clipID: UInt32)

    // Structure defining the portion of a clip
    pub enum Sequence: UInt8 {
        pub case beginning
        pub case middle
        pub case end
    }

    pub struct Clip {
        // The unique ID for the Clip
        pub let id: UInt32

        // Represents the creator of the Clip
        pub let creatorID: UInt32

        // The sequence of the provided clip
        pub let sequence: Sequence

        // Stores all the metadata about the Clip as a string mapping
        pub let metadata: {String: String}

        init(creatorID: UInt32, sequence: Sequence, metadata: {String: String}) {
            pre {
                metadata.length > 0: "Metadata cannot be empty"
            }

            self.id = Shard.totalClips
            self.creatorID = creatorID
            self.sequence = sequence
            self.metadata = metadata

            // Increment the ID so that it isn't used again
            Shard.totalClips = Shard.totalClips + (1 as UInt32)

            emit ShardCreated(
                id: self.id,
                creatorID: self.creatorID,
                sequence: self.sequence.rawValue,
                metadata: self.metadata
            )
        }
    }

    pub resource NFT: NonFungibleToken.INFT {
        // Identifier of NFT
        pub let id: UInt64

        // Clip ID corresponding to the Shard
        pub let clipID: UInt32

        init(initID: UInt64, clipID: UInt32) {
            pre {
                Shard.clips.containsKey(clipID): "Clip ID does not exist"
            }

            self.id = initID
            self.clipID = clipID

            emit ShardMinted(id: self.id, clipID: self.clipID)
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

    // A special authorization resource with administrative functions
    pub resource Admin {
        // Creates a new Clip struct and returns the ID
        pub fun createClip(
            creatorID: UInt32,
            sequence: Sequence,
            metadata: {String: String}
        ): UInt32 {
            // Create the new Clip
            var newClip = Clip(
                creatorID: creatorID,
                sequence: sequence,
                metadata: metadata
            )
            let newID = newClip.id

            // Store it in the contract storage
            Shard.clips[newID] = newClip

            return newID
        }

        // Mints a new NFT with a new ID
        pub fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            clipID: UInt32,
        ) {
            // Creates a new NFT with provided arguments
            var newNFT <- create NFT(
                initID: Shard.totalSupply,
                clipID: clipID
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

    // Publicly get metadata for a given Clip ID
    pub fun getClipMetadata(clipID: UInt32): {String: String}? {
        return self.clips[clipID]?.metadata
    }

    // Publicly get all Clips
    pub fun getAllClips(): [Shard.Clip] {
        return Shard.clips.values
    }

    init() {
        // Initialize the total supply
        self.totalSupply = 0
        self.totalClips = 0

        // Initialize with an empty set of clips
        self.clips = {}

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

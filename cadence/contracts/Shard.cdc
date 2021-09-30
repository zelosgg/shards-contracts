import NonFungibleToken from 0xNonFungibleToken

// Eternal
// eternal.gg
//
// Three Shards are to be combined to form a Crystal.
// Each Shard belongs to 1/3 of a moment.
pub contract Shard: NonFungibleToken {
    // Total supply also correlating to the next mint ID
    pub var totalSupply: UInt64

    // Events
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)

    pub resource NFT: NonFungibleToken.INFT {
        // Identifier of NFT
        pub let id: UInt64
        // Moment ID
        pub let momentID: UInt64
        // Metadata URI
        pub var metadata: {String: String}

        init(initID: UInt64, momentID: UInt64) {
            self.id = initID
            self.momentID = momentID
            self.metadata = {}
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

    // Public function that anyone can call to create a new empty collection
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    // Resource that an admin or something similar would own to be
    // able to mint new NFTs
    pub resource ShardMinter {
        // Mints a new NFT with a new ID
        pub fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}, momentID: UInt64) {
            // Creates a new NFT
            var newNFT <- create NFT(initID: Shard.totalSupply, momentID: momentID)

            // Deposits it in the recipient's account using their reference
            recipient.deposit(token: <-newNFT)

            // Increase the total supply counter
            Shard.totalSupply = Shard.totalSupply + (1 as UInt64)
        }
    }

    init() {
        // Initialize the total supply
        self.totalSupply = 0

        // Create a Collection resource and save it to storage
        let collection <- create Collection()
        self.account.save(<-collection, to: /storage/ShardCollection)

        // Create a public capability for the collection
        self.account.link<&{NonFungibleToken.CollectionPublic}>(
            /public/ShardCollection,
            target: /storage/ShardCollection
        )

        // Create a Minter resource and save it to storage
        let minter <- create ShardMinter()
        self.account.save(<-minter, to: /storage/ShardMinter)

        emit ContractInitialized()
    }
}

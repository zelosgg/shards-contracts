import {
  sendTransaction,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

const transfer = async (operator, from, to) => {
  // Get the contract addresses
  const Shard = await getContractAddress("Shard");

  // The Cadence transaction code
  const code = `
        import Shard from ${Shard}
        transaction(recipient: Address, withdrawID: UInt64) {
            prepare(acct: AuthAccount) {
                let recipient = getAccount(recipient)
                let collectionRef = acct.borrow<&Shard.Collection>(from: /storage/EternalShardCollection)
                    ?? panic("Could not borrow a reference to the owner's collection")
                let depositRef = recipient.getCapability(/public/EternalShardCollection)
                    .borrow<&{Shard.ShardCollectionPublic}>()
                    ?? panic("Could not borrow a reference to the receiver's collection")
                let nft <- collectionRef.withdraw(withdrawID: withdrawID)
                depositRef.deposit(token: <-nft)
            }
        }
    `;

  // Transfer token #0 from sender to receiver
  const args = [await getAccountAddress(to), 0];
  const signers = [await getAccountAddress(from)];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    args,
    signers,
  });
};

export default transfer;

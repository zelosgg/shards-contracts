import {
  shallPass,
  sendTransaction,
  getAccountAddress,
  deployContractByName,
} from "flow-js-testing";

const mint = async (owner, signer) => {
  // Deploy the contract from the owner
  const to = await getAccountAddress(owner);
  const name = "Shard";
  await deployContractByName({ to, name });

  const from = await getAccountAddress(signer);
  const code = `
      import ${name} from ${owner}
      transaction {
          let receiverRef: &{Shard.ShardReceiver}
          let minterRef: &Shard.ShardMinter

          prepare(acct: AuthAccount) {
              self.receiverRef = acct.getCapability<&{Shard.ShardReceiver}>(/public/ShardReceiver).borrow()
                  ?? panic("Could not borrow receiver reference")
              self.minterRef = acct.borrow<&Shard.ShardMinter>(from: /storage/ShardMinter)
                  ?? panic("could not borrow minter reference")
          }

          execute {
              let newShard <- self.minterRef.mintShard()
              self.receiverRef.deposit(token: <-newShard)
              log("Sahrd Minted and deposited to Account 2's Collection")
          }
      }
  `;

  // Create a new account from the given parameter
  const signers = [from];

  // Send the transaction and return the result
  return await sendTransaction({
    code,
    signers,
  });
};

export default mint;

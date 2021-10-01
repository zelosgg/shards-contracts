import {
  deployContractByName,
  getAccountAddress,
  getContractAddress,
} from "flow-js-testing";

const deploy = async (owner) => {
  {
    // Deploy the NonFungibleToken contract from the provided address
    const name = "NonFungibleToken";
    const to = await getAccountAddress(owner);
    await deployContractByName({ name, to });
  }

  {
    // Get address of deployed NonFungibleToken
    const NonFungibleToken = await getContractAddress("NonFungibleToken");

    // Deploy the Shard contract from the provided address
    const name = "Shard";
    const addressMap = { NonFungibleToken };
    const to = await getAccountAddress(owner);
    await deployContractByName({ name, addressMap, to });
  }
};

export default deploy;

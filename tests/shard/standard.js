import {
    sendTransaction,
    getAccountAddress,
    deployContractByName,
} from "flow-js-testing";

const deployNonFungibleToken = async () => {
    // Deploy the contract from the owner
    const name = "NonFungibleToken";
    return await deployContractByName({ name });
};

export default deployNonFungibleToken;

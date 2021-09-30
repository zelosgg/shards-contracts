import path from "path";
import {
  init,
  emulator,
  shallPass,
  shallRevert,
} from "flow-js-testing";
import fund from '../fund-accounts'
import mint from "../mint";
import createCollection from "../create-collection";
import deploy from "../deploy";
import transfer from '../transfer'

// We need to set timeout for a higher number, because some transactions might take up some time
jest.setTimeout(10000);

describe("shard", () => {
  beforeEach(async () => {
    // Start the emulator
    const basePath = path.resolve(__dirname, "../../cadence");
    await init(basePath);
    return emulator.start();
  });

  // Stop emulator, so it could be restarted
  afterEach(async () => {
    return emulator.stop();
  });

  test("initialize storage", async () => {
    // Fund all involved accounts
    await fund("operator", "user")
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Assert a user can initialize their storage
    await shallPass(createCollection("user"));
  });

  test("operator can mint", async () => {
    // Fund all involved accounts
    await fund("operator", "non-operator")
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Create collections for all involved accounts
    await createCollection("operator", "non-operator");
    // Assert the operator can mint
    await shallPass(mint("operator", "non-operator"));
  });

  test("non-operator cannot mint", async () => {
    // Fund all involved accounts
    await fund("operator", "non-operator")
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Create collections for all involved accounts
    await createCollection("operator", "non-operator");
    // Assert non-operators cannot mint
    await shallRevert(mint("non-operator", "non-operator"));
  });

  test("owner can transfer", async () => {
    // Fund all involved accounts
    await fund("operator", "sender", "receiver")
    // Deploy all contracts
    await deploy("operator")
    // Create a collections for all involved accounts
    await createCollection("operator", "sender", "receiver")
    // Mint an NFT to the sender
    await mint("operator", "sender")
    // Assert sender can transfer their NFT
    await shallPass(transfer("operator", "sender", "receiver"))
  })

  test("non-owner can't transfer", async () => {
    // Fund all involved accounts
    await fund("operator", "sender", "receiver")
    // Deploy all contracts
    await deploy("operator")
    // Create a collections for all involved accounts
    await createCollection("operator", "sender", "receiver")
    // Mint an NFT to the sender
    await mint("operator", "sender")
    // Assert receiver cannot transfer since they don't have an NFT
    await shallRevert(transfer("operator", "receiver", "sender"))
  })
});

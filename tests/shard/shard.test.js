import path from "path";
import { init, emulator, shallPass, shallRevert } from "flow-js-testing";
import fund from "../fund-accounts";
import mint from "../mint-nft";
import mintBatch from "../mint-batch-nft";
import createCollection from "../create-collection";
import deploy from "../deploy-contracts";
import transfer from "../transfer-nft";
import createClip from "../create-clip";
import createMoment from "../create-moment";

// We need to set timeout for a higher number, because some transactions might take up some time
jest.setTimeout(10000);

describe("shard", () => {
  beforeEach(async () => {
    // Start the emulator
    const basePath = path.resolve(__dirname, "../../cadence");
    await init(basePath);
    return emulator.start();
  });

  afterEach(async () => {
    // Stop emulator, so it could be restarted
    return emulator.stop();
  });

  test("initialize storage", async () => {
    // Fund all involved accounts
    await fund("operator", "user");
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Assert a user can initialize their storage
    await shallPass(createCollection("user"));
  });

  test("operator can create new moment", async () => {
    // Fund all involved accounts
    await fund("operator");
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Assert that operator can create new Clips
    await shallPass(createMoment("operator"));
  });

  test("non-operator can't create new moment", async () => {
    // Fund all involved accounts
    await fund("operator", "non-operator");
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Assert that operator can create new Clips
    await shallRevert(createMoment("non-operator"));
  });

  test("creator metadata cannot be empty", async () => {
    // Fund all involved accounts
    await fund("operator");
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Assert that operator can create new Clips
    await shallRevert(createMoment("operator", undefined, ""));
  });

  test("operator can create new clip", async () => {
    // Fund all involved accounts
    await fund("operator");
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Create a new Moment
    const moment = await createMoment("operator");
    const momentID = moment.events[0].data.id;
    // Assert that operator can create new Clips
    await shallPass(createClip("operator", momentID));
  });

  test("non-operator can't create new clip", async () => {
    // Fund all involved accounts
    await fund("operator", "non-operator");
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Create a new Moment
    const moment = await createMoment("operator");
    const momentID = moment.events[0].data.id;
    // Assert that non-operator can't create new Clips
    await shallRevert(createClip("non-operator", momentID));
  });

  test("clip metadata cannot be empty", async () => {
    // Fund all involved accounts
    await fund("operator");
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Create a new Moment
    const moment = await createMoment("operator");
    const momentID = moment.events[0].data.id;
    // Assert that non-operator can't create new Clips
    await shallRevert(createClip("operator", momentID, ""));
  });

  test("new clip must have valid moment ID", async () => {
    // Fund all involved accounts
    await fund("operator");
    // Deploy all contracts from the operator account
    await deploy("operator");
    // Assert that operator can create new Clips
    await shallRevert(createClip("operator", 55));
  });

  describe("minting", () => {
    beforeEach(async () => {
      // Fund all involved accounts
      await fund("operator", "non-operator");
      // Deploy all contracts from the operator account
      await deploy("operator");
      // Create collections for all involved accounts
      await createCollection("operator", "non-operator");
    });

    test("operator can mint", async () => {
      // Create a new Moment
      const moment = await createMoment("operator");
      const momentID = moment.events[0].data.id;
      // Create a new clip and get it's ID
      const clip = await createClip("operator", momentID);
      const clipID = clip.events[0].data.id;
      // Assert the operator can mint
      await shallPass(mint("operator", "non-operator", clipID));
    });

    test("non-operator cannot mint", async () => {
      // Create a new Moment
      const moment = await createMoment("operator");
      const momentID = moment.events[0].data.id;
      // Create a new clip and get it's ID
      const clip = await createClip("operator", momentID);
      const clipID = clip.events[0].data.id;
      // Assert non-operators cannot mint
      await shallRevert(mint("non-operator", "non-operator", clipID));
    });

    test("batch minting", async () => {
      // Create a new Moment
      const moment = await createMoment("operator");
      const momentID = moment.events[0].data.id;
      // Create a new clip and get it's ID
      const clip = await createClip("operator", momentID);
      const clipID = clip.events[0].data.id;
      // Assert the operator can mint
      await shallPass(mintBatch("operator", "non-operator", clipID));
    });

    test("new mints must have valid clip ID", async () => {
      // Assert that invalid clip ID reverts
      await shallRevert(mint("operator", "operator", 55));
    });
  });

  test("owner can transfer", async () => {
    // Fund all involved accounts
    await fund("operator", "sender", "receiver");
    // Deploy all contracts
    await deploy("operator");
    // Create a collections for all involved accounts
    await createCollection("operator", "sender", "receiver");
    // Create a new Moment
    const moment = await createMoment("operator");
    const momentID = moment.events[0].data.id;
    // Create a new clip and get it's ID
    const clip = await createClip("operator", momentID);
    const clipID = clip.events[0].data.id;
    // Mint an NFT to the sender
    await mint("operator", "sender", clipID);
    // Assert sender can transfer their NFT
    await shallPass(transfer("operator", "sender", "receiver"));
  });

  test("non-owner can't transfer", async () => {
    // Fund all involved accounts
    await fund("operator", "sender", "receiver");
    // Deploy all contracts
    await deploy("operator");
    // Create a collections for all involved accounts
    await createCollection("operator", "sender", "receiver");
    // Create a new Moment
    const moment = await createMoment("operator");
    const momentID = moment.events[0].data.id;
    // Create a new clip and get it's ID
    const clip = await createClip("operator", momentID);
    const clipID = clip.events[0].data.id;
    // Mint an NFT to the sender
    await mint("operator", "sender", clipID);
    // Assert receiver cannot transfer since they don't have an NFT
    await shallRevert(transfer("operator", "receiver", "sender"));
  });
});

import path from "path";
import { init, emulator, shallPass, shallRevert, executeScript, getAccountAddress } from "flow-js-testing";
import fund from "../fund-accounts";
import deploy from "../deploy-contracts";
import createCollection from "./create-collection";

import createShardCollection from "../shard/create-collection"
import createMoment from "../shard/create-moment"
import createClip from "../shard/create-clip"
import mintBatch from "../shard/mint-batch-nft"

// We need to set timeout for a higher number, because some transactions might take up some time
jest.setTimeout(10000);

describe("crystal", () => {
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

  describe("merging", () => {
    // Define a split between 2-20 to use among all tests
    const splitLimit = Math.floor(Math.random() * 18) + 2;

    beforeEach(async () => {
      // Fund all involved accounts
      await fund("operator", "user");
      // Deploy all contracts from the operator account
      await deploy("operator");
      // Initialize user Shard storage
      await createShardCollection("user")
      // Initialize user Crystal storage
      await createCollection("user");
      // Create a new Moment
      const moment = await createMoment("operator", undefined, splitLimit);
      const momentID = moment.events[0].data.id;
      // Create a new clip and get it's ID
      const clip = await createClip("operator", momentID, splitLimit - 1);
      const clipID = clip.events[0].data.id;
      // Mint an NFT to the user
      await mintBatch("operator", "user", clipID, splitLimit);
    });

    test("get shard splits", async () => {
      const args = [await getAccountAddress("user"), 0]
      const response = await executeScript({
        name: "get-shard-splits",
        args,
      });
      expect(response).toEqual(splitLimit)
    })

    test("check can merge returns expected result", async () => {
      const ids = Array.from(Array(splitLimit).keys())
      const canMerge = await executeScript({
        name: "check-can-merge",
        args: [await getAccountAddress("user"), ids],
      });
      const cantMerge = await executeScript({
        name: "check-can-merge",
        args: [await getAccountAddress("user"), ids.slice(-1)],
      });
      expect(canMerge).toEqual(true)
      expect(cantMerge).toEqual(false)
    })
  })
});

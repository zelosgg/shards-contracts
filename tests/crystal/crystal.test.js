import path from "path";
import {
  init,
  emulator,
  shallPass,
  executeScript,
  sendTransaction,
  getAccountAddress,
} from "flow-js-testing";
import fund from "../fund-accounts";
import deploy from "../deploy-contracts";
import createCollection from "./create-collection";

import createShardCollection from "../shard/create-collection";
import createMoment from "../shard/create-moment";
import createClip from "../shard/create-clip";
import mint from "../shard/mint-nft";
import mintBatch from "../shard/mint-batch-nft";
import calculatePurity from "./calculate-purity";

// We need to set timeout for a higher number, because some transactions might take up some time
jest.setTimeout(30000);

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
    const splitLimit = 3; //Math.floor(Math.random() * 18) + 2;

    // Define an array of Shard NFT IDs
    var nfts = [];

    beforeEach(async () => {
      nfts = [];

      // Fund all involved accounts
      await fund("operator", "user");
      // Deploy all contracts from the operator account
      await deploy("operator");
      // Initialize user Shard storage
      await createShardCollection("user");
      // Initialize user Crystal storage
      await createCollection("user");

      var moments = [];

      // Create new clips, moments, and NFTs
      for (let x = 0; x <= 3; x++) {
        const moment = await createMoment(
          "operator",
          String.fromCharCode(97 + Math.floor(Math.random() * 3)),
          splitLimit
        );
        moments.push(moment.events[0].data);
        for (const split in [...Array(splitLimit).keys()]) {
          const moment = moments[Math.floor(Math.random() * moments.length)];
          // Create a new clip with a random momentID
          const clip = await createClip("operator", moment.id, parseInt(split));
          const clipID = clip.events[0].data.id;
          // Mint NFTs to the user
          for (let x = 0; x < 2; x++) {
            const nft = await mint("operator", "user", clipID);
            const shard = nft.events[0].data;
            nfts.push({
              id: shard.id,
              creatorId: moment.influencerID,
              momentId: clip.events[0].data.momentID,
              clipId: clipID,
              sequence: clip.events[0].data.sequence,
            });
          }
        }
      }
    });

    test("get shard splits", async () => {
      const args = [await getAccountAddress("user"), 0];
      const response = await executeScript({
        name: "get-shard-splits",
        args,
      });
      expect(response).toEqual(splitLimit);
    });

    test("check can merge returns expected result", async () => {
      const canMerge = await executeScript({
        name: "check-can-merge",
        args: [
          await getAccountAddress("user"),
          nfts
            .map((k, v) => v)
            .sort(() => Math.random() - Math.random())
            .slice(0, splitLimit),
        ],
      });
      const cantMerge = await executeScript({
        name: "check-can-merge",
        args: [
          await getAccountAddress("user"),
          nfts
            .map((k, v) => v)
            .sort(() => Math.random() - Math.random())
            .slice(0, splitLimit)
            .slice(-1),
        ],
      });
      expect(canMerge).toEqual(true);
      expect(cantMerge).toEqual(false);
    });

    test("getting purity returns expected result", async () => {
      const shards = [
        ...nfts.sort(() => Math.random() - 0.5).slice(0, splitLimit),
      ];
      const calculatedPurity = calculatePurity([...shards]);
      const purity = await executeScript({
        name: "get-purity",
        args: [
          await getAccountAddress("user"),
          shards.map((k) => parseInt(k.id)),
        ],
      });

      expect(purity).toEqual(calculatedPurity);
    });

    test("merging returns a crystal", async () => {
      const shards = [
        ...nfts.sort(() => Math.random() - 0.5).slice(0, splitLimit),
      ];

      const result = await sendTransaction({
        name: "merge-shards",
        signers: [await getAccountAddress("user")],
        args: [
          await getAccountAddress("user"),
          shards.map((k) => parseInt(k.id)),
        ],
      });

      expect(result.events.length).toEqual(5)
    });
  });
});

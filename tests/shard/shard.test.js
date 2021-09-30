import path from "path";
import {
  init,
  emulator,
  shallPass,
  shallRevert,
  getAccountAddress,
} from "flow-js-testing";
import mint from "../mint";
import createCollection from "../create-collection";
import deploy from "../deploy";

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
    await deploy("operator");
    await shallPass(createCollection("user"));
  });

  test("operator can mint", async () => {
    await deploy("operator");
    await shallPass(mint("operator"));
  });

  test("non-operator cannot mint", async () => {
    await deploy("operator");
    await shallRevert(mint("non-operator"));
  });
});

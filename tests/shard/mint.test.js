import path from "path";
import { init, emulator, shallPass, shallRevert } from "flow-js-testing";
import mint from "./mint";

// We need to set timeout for a higher number, because some transactions might take up some time
jest.setTimeout(10000);

describe("shard - minting", () => {
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

  test("owner of shard contract can mint", async () => {
    // Ensure that the transaction succeeds
    const txResult = await shallPass(mint("owner", "owner"));

    // Transaction result will hold status, events and error message
    console.log(txResult);
  });

  test("non-owner of shard contract cannot mint", async () => {
    // Ensure that the transaction reverts
    const txResult = await shallRevert(mint("owner", "non-owner"));

    // Transaction result will hold status, events and error message
    console.log(txResult);
  });
});

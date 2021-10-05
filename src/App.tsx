import { useState } from "react";
import { FlowService } from "./FlowService";
import * as fcl from "@onflow/fcl";
import * as types from "@onflow/types";

import { clips, moments } from "./shards";

const Shard = process.env.REACT_APP_FLOW_SHARD_ADDRESS;
const NonFungibleToken = process.env.REACT_APP_FLOW_NFT_ADDRESS;
fcl
  .config()
  .put("accessNode.api", "https://access-testnet.onflow.org")
  .put("0xNonFungibleToken", NonFungibleToken)
  .put("0xShard", Shard);

function App() {
  const service = new FlowService(
    process.env.REACT_APP_FLOW_ACCOUNT_ADDRESS!,
    process.env.REACT_APP_FLOW_ACCOUNT_PRIVATE_KEY!,
    0
  );
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [csv, setCsv] = useState("");

  async function resetContract() {
    setResetting(true);
    const authorization = service.authz();
    // Create moment
    var response = await fcl.send([
      fcl.transaction`
import NonFungibleToken from ${NonFungibleToken}
transaction() {
    prepare(account: AuthAccount) {
        destroy <- account.load<@AnyResource>(from:/storage/EternalShardCollection)
        destroy <- account.load<@AnyResource>(from:/storage/EternalShardAdmin)
    }
}
        `,
      fcl.proposer(authorization),
      fcl.payer(authorization),
      fcl.authorizations([authorization]),
      fcl.limit(9999),
    ]);
    await fcl.tx(response).onceSealed();
    setResponses((responses) => [
      ...responses,
      { title: "Contract Reset: ", response: response },
    ]);
    setResetting(false);
  }

  async function initializeStorage() {
    const authorization = service.authz();
    // Create moment
    var response = await fcl.send([
      fcl.transaction`
import NonFungibleToken from ${NonFungibleToken}
import Shard from ${Shard}
transaction {
    prepare(acct: AuthAccount) {
        if acct.borrow<&Shard.Collection>(from: /storage/EternalShardCollection) != nil {
            return
        }
        let collection <- Shard.createEmptyCollection()
        acct.save(<-collection, to: /storage/EternalShardCollection)
        acct.link<&{Shard.ShardCollectionPublic}>(
            /public/EternalShardCollection,
            target: /storage/EternalShardCollection
        )
    }
}
        `,
      fcl.proposer(authorization),
      fcl.payer(authorization),
      fcl.authorizations([authorization]),
      fcl.limit(9999),
    ]);
    const transaction = await fcl.tx(response).onceSealed();
    setResponses((responses) => [
      ...responses,
      { title: "Initialized Storage: ", response: response },
    ]);
  }

  async function createMoments() {
    for (const moment of moments) {
      const authorization = service.authz();
      // Create moment
      var response = await fcl.send([
        fcl.transaction`
import Shard from ${Shard}
transaction(influencerID: String, splits: UInt8, metadata: {String: String}) {
    let minter: &Shard.Admin
    prepare(signer: AuthAccount) {
        self.minter = signer.borrow<&Shard.Admin>(from: /storage/EternalShardAdmin)
            ?? panic("Could not borrow a reference to the Shard minter")
    }
    execute {
        self.minter.createMoment(influencerID: influencerID, splits: splits, metadata: metadata)
    }
}
        `,
        fcl.args([
          fcl.arg("Influencer Name", types.String),
          fcl.arg(3, types.UInt8),
          fcl.arg(
            [
              { key: "title", value: moment.title },
              { key: "game", value: moment.game },
            ],
            types.Dictionary({ key: types.String, value: types.String })
          ),
        ]),
        fcl.proposer(authorization),
        fcl.payer(authorization),
        fcl.authorizations([authorization]),
        fcl.limit(9999),
      ]);
      const transaction = await fcl.tx(response).onceSealed();
      setResponses((responses) => [
        ...responses,
        { title: `Moment ${moment.title}: `, response: response },
      ]);
      let sequence = 0;
      for (const clip of clips) {
        if (clip.title === moment.title) {
          const momentId = transaction.events[0].data.id;
          await createClip(momentId, sequence, clip);
          sequence++;
        }
      }
    }
  }

  async function createClip(momentId: number, sequence: number, clip: any) {
    const authorization = service.authz();
    // Create moment
    var response = await fcl.send([
      fcl.transaction`
import Shard from ${Shard}
transaction(momentID: UInt32, sequence: UInt8, metadata: {String: String}) {
    let minter: &Shard.Admin
    prepare(signer: AuthAccount) {
        self.minter = signer.borrow<&Shard.Admin>(from: /storage/EternalShardAdmin)
            ?? panic("Could not borrow a reference to the Shard minter")
    }
    execute {
        self.minter.createClip(momentID: momentID, sequence: sequence, metadata: metadata)
    }
}
        `,
      fcl.args([
        fcl.arg(momentId, types.UInt32),
        fcl.arg(sequence, types.UInt8),
        fcl.arg(
          [
            { key: "title", value: clip.title },
            { key: "video_hash", value: clip.video_hash },
          ],
          types.Dictionary({ key: types.String, value: types.String })
        ),
      ]),
      fcl.proposer(authorization),
      fcl.payer(authorization),
      fcl.authorizations([authorization]),
      fcl.limit(9999),
    ]);
    const transaction = await fcl.tx(response).onceSealed();
    setResponses((responses) => [
      ...responses,
      { title: `Clip ${clip.title} ${sequence + 1}/3: `, response: response },
    ]);
    const clipId = transaction.events[0].data.id;
    await batchMint(clipId, 300);
  }

  async function batchMint(clipId: number, amount: number) {
    const authorization = service.authz();
    // Create moment
    var response = await fcl.send([
      fcl.transaction`
import NonFungibleToken from ${NonFungibleToken}
import Shard from ${Shard}
transaction(recipient: Address, clipID: UInt32, quantity: UInt64) {
    let minter: &Shard.Admin
    prepare(signer: AuthAccount) {
        self.minter = signer.borrow<&Shard.Admin>(from: /storage/EternalShardAdmin)
            ?? panic("Could not borrow a reference to the Shard minter")
    }
    execute {
        let receiver = getAccount(recipient)
            .getCapability(/public/EternalShardCollection)
            .borrow<&{Shard.ShardCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Shard Collection")
        self.minter.batchMintNFT(recipient: receiver, clipID: clipID, quantity: quantity)
    }
}
        `,
      fcl.args([
        fcl.arg("0x" + ((await authorization()) as any).addr, types.Address),
        fcl.arg(clipId, types.UInt32),
        fcl.arg(amount, types.UInt64),
      ]),
      fcl.proposer(authorization),
      fcl.payer(authorization),
      fcl.authorizations([authorization]),
      fcl.limit(9999),
    ]);
    await fcl.tx(response).onceSealed();
    setResponses((responses) => [
      ...responses,
      { title: `Minted Batch: ${amount}`, response: response },
    ]);
  }

  async function getShardData() {
    setSending(true);
    const response = await fcl.send([
      fcl.script`
import NonFungibleToken from ${NonFungibleToken}
import Shard from ${Shard}
pub fun main(): [AnyStruct] {
    let owner = getAccount(0x${process.env.REACT_APP_FLOW_ACCOUNT_ADDRESS})
        .getCapability(/public/EternalShardCollection)
        .borrow<&{Shard.ShardCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Shard Collection")
    let allTokens: [AnyStruct] = []
    let ids = owner.getIDs()
    for id in ids {
        let tokenData: [AnyStruct] = []
        let nft = owner.borrowShardNFT(id: id)!
        let clip = Shard.getClip(clipID: nft.clipID)!
        let clipMetadata = Shard.getClipMetadata(clipID: clip.id)!
        let moment = Shard.getMoment(momentID: clip.momentID)!
        let momentMetadata = Shard.getMomentMetadata(momentID: moment.id)!
        tokenData.append(id)
        tokenData.append(owner.borrowNFT(id: id).uuid)
        for cd in clipMetadata.values {
            tokenData.append(cd)
        }
        for md in momentMetadata.values {
            tokenData.append(momentMetadata.values)
        }
        allTokens.append(tokenData)
    }
    return allTokens
}
      `,
    ]);
    const allTokens = await fcl.decode(response);
    console.log(allTokens);
    console.log(allTokens.length);
    for (const token in allTokens) {
      setCsv((csv) => csv + allTokens[token] + "\n");
    }

    setSending(false);
  }

  async function sendTransaction() {
    setSending(true);
    await initializeStorage();
    await createMoments();
    setSending(false);
  }

  return (
    <div className="App">
      <button onClick={sendTransaction} disabled={sending}>
        Create Everything
      </button>
      <button onClick={resetContract} disabled={resetting || sending}>
        Reset Contract
      </button>
      <button onClick={getShardData} disabled={sending}>
        Retrieve all data
      </button>
      <ul>
        {responses.map((key, index) => (
          <li key={index}>
            {(responses[index] as any).title}{" "}
            <a
              href={
                responses[index] !== undefined
                  ? `https://testnet.flowscan.org/transaction/${
                      (responses[index] as any).response.transactionId
                    }`
                  : ""
              }
            >
              view on flowscan
            </a>
          </li>
        ))}
      </ul>
      {csv !== "" && <textarea value={csv} readOnly></textarea>}
    </div>
  );
}

export default App;

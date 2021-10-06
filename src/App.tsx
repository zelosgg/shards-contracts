import { useState } from "react";
import { FlowService } from "./FlowService";
import * as fcl from "@onflow/fcl";
import * as types from "@onflow/types";
import { saveAs } from "file-saver";

import { clips, moments, splits } from "./shards";

const Shard = process.env.REACT_APP_FLOW_SHARD_ADDRESS;
const NonFungibleToken = process.env.REACT_APP_FLOW_NFT_ADDRESS;
fcl
  .config()
  .put("accessNode.api", process.env.REACT_APP_FLOW_ACCESS_NODE)
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
          fcl.arg(moment.creator, types.String),
          fcl.arg(splits, types.UInt8),
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
      for (const clip of clips) {
        if (clip.title === moment.title) {
          const momentId = transaction.events[0].data.id;
          await createClip(momentId, clip);
        }
      }
    }
  }

  async function createClip(momentId: number, clip: any) {
    const sequence: number = parseInt(clip.sequence);
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
            { key: "video_url", value: clip.video_url },
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
      {
        title: `Clip ${clip.title} ${sequence + 1}/3: `,
        response: response,
      },
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
    setCsv(
      (csv) =>
        csv +
        "Getting all metadata from the blockchain... This could take a while" +
        "\n"
    );
    var csv = "";
    csv += ",,,,,,,,,,,\n";
    csv +=
      ",id,resourceId,title,description,uri,rarity,edition,editions,image,video_mp4,video_webm\n";
    const description =
      "Peer into the shard to see a moment in streaming history. Each Eternal shard is a third of a moment we've immortalized on the blockchain. Collect or pool three shards together to form an Eternal crystal that can be used to enhance a moment in a pack, dropping on October 22. The purer the shard, the higher chance for a rarer moment. All shards and crystals are tradeable at Eternal.gg ";
    const idRequest = await fcl.send([
      fcl.script`
import NonFungibleToken from ${NonFungibleToken}
import Shard from ${Shard}
pub fun main(): [UInt64] {
    let owner = getAccount(0x${process.env.REACT_APP_FLOW_ACCOUNT_ADDRESS})
        .getCapability(/public/EternalShardCollection)
        .borrow<&{Shard.ShardCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Shard Collection")
    let ids = owner.getIDs()
    return ids
}
      `,
    ]);
    const ids = await fcl.decode(idRequest);
    for (const id in ids) {
      const response = await fcl.send([
        fcl.script`
import NonFungibleToken from ${NonFungibleToken}
import Shard from ${Shard}
pub struct TokenData{
    pub let id: UInt64
    pub let uuid: UInt64
    pub let clip: Shard.Clip
    pub let moment: Shard.Moment
    init(_ id: UInt64, _ uuid: UInt64, _ clip: Shard.Clip, _ moment: Shard.Moment){
        self.id = id
        self.uuid = uuid
        self.clip = clip
        self.moment = moment
    }
}
pub fun main(id: UInt64): TokenData {
    let owner = getAccount(0x${process.env.REACT_APP_FLOW_ACCOUNT_ADDRESS})
        .getCapability(/public/EternalShardCollection)
        .borrow<&{Shard.ShardCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Shard Collection")
    let nft = owner.borrowShardNFT(id: id)!
    let clip = Shard.getClip(clipID: nft.clipID)!
    let moment = Shard.getMoment(momentID: clip.momentID)!
    let id = nft.id
    let uuid = nft.uuid
    return TokenData(id, nft.uuid, clip, moment)
}
      `,
        fcl.args([fcl.arg(parseInt(id), types.UInt64)]),
      ]);
      const token = await fcl.decode(response);
      csv +=
        `,${token.id},${token.uuid},${
          token.moment.metadata.title +
          `(${parseInt(token.clip.sequence) + 1}/${token.moment.splits})`
        },${description},https://eternal.gg/shards/${token.id},,,,,${
          token.clip.metadata.video_url
        },` + "\n";
      if (parseInt(id) % 100 == 0) setCsv(`${id}/${ids.length}`);
    }
    const blob = new Blob([csv], {
      type: "application/csv;charset=UTF-8",
    });
    saveAs(blob, "shards.csv");
    setCsv("Done. Saving");
    setSending(false);
  }

  async function getNFTCount() {
    setSending(true);
    const response = await fcl.send([
      fcl.script`
import Shard from ${Shard}
pub fun main(): Int {
    let owner = getAccount(0x${process.env.REACT_APP_FLOW_ACCOUNT_ADDRESS})
        .getCapability(/public/EternalShardCollection)
        .borrow<&{Shard.ShardCollectionPublic}>()
            ?? panic("Could not get receiver reference to the Shard Collection")
    let ids = owner.getIDs()
    return ids.length
}
      `,
    ]);
    const amount = await fcl.decode(response);
    setResponses((responses) => [
      ...responses,
      { title: `Total Shard NFTs: ${amount}`, response: response },
    ]);
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
      <button onClick={getNFTCount} disabled={sending}>
        Get total Shard count
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
      {csv !== "" && <p>{csv}</p>}
    </div>
  );
}

export default App;

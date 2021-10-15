import json
import os
import tempfile
import csv

from rich import print
from random import randrange

AIRDROP: str = "./cadence/transactions/airdrop.cdc"
NETWORK: str = "mainnet"
# RECEIVER: str = "1f56a1e665826a52"
# NETWORK: str = "testnet"
# RECEIVER: str = "71db3ec2cdcea1f1"


def chunker(seq, size):
    return (seq[pos : pos + size] for pos in range(0, len(seq), size))


def compile(network: str, script: str) -> str:
    with open(script, "r") as file:
        script = file.read()
        if network == "mainnet":
            script = script.replace("0xNonFungibleToken", "0x1d7e57aa55817448")
            script = script.replace("0xShard", "0x82b54037a8f180cf")
            return script
        elif network == "testnet":
            script = script.replace("0xNonFungibleToken", "0x631e88ae7f1d7c20")
            script = script.replace("0xShard", "0x30b0d80610989b9f")
            return script


def main():
    with open("./scripts/airdrop.csv", "r") as airdrop_file:
        users = list(csv.DictReader(airdrop_file))
        total_shards = 0
        top_10 = 0
        top_40 = 0
        bottom_60 = 0
        for index, user in enumerate(users):
            if float(user["sum"]) > 600:
                top_10 += 1
                total_shards += 3
                users[index]["shards"] = {"amount": 3}
            elif float(user["sum"]) > 100:
                top_40 += 1
                total_shards += 2
                users[index]["shards"] = {"amount": 2}
            else:
                bottom_60 += 1
                total_shards += 1
                users[index]["shards"] = {"amount": 1}

        print("all users", len(users))
        print(
            "top", "{0:.0%}".format(top_10 / len(users)), ":", top_10, "- 3 shards each"
        )
        print(
            "next",
            "{0:.0%}".format(top_40 / len(users)),
            ":",
            top_40,
            "- 2 shards each",
        )
        print(
            "next",
            "{0:.0%}".format(bottom_60 / len(users)),
            ":",
            bottom_60,
            "- 1 shard each",
        )
        print("total shards", total_shards)

        with tempfile.NamedTemporaryFile(suffix=".cdc") as contract:
            compiled_contract = compile(NETWORK, AIRDROP).encode("utf-8")
            contract.write(compiled_contract)
            contract.read()

            address_mapping = []
            shard_mapping = []
            for user in users:
                counter = 0
                for shard_amount in range(user['shards']['amount']):
                    counter += 1
                    if counter <= 1:
                        continue
                    address_mapping.append(
                        {"type": "Address", "value": "0x" + user["address"]}
                    )
                    # address_mapping.append({'type': 'Address', 'value': '0x' + RECEIVER})
                    shard_mapping.append({"type": "UInt32", "value": str(randrange(45))})

            counter = 0
            for i in range(0, len(address_mapping), 300):
                counter += 1
                if counter != 2:
                    continue
                args = [{"type": "Array", "value": []}, {"type": "Array", "value": []}]
                address_chunk = address_mapping[i : i + 300]
                shard_chunk = shard_mapping[i : i + 300]
                args[0]["value"] = address_chunk
                args[1]["value"] = shard_chunk
                command = f"flow transactions send \
                    {contract.name} \
                    --network {NETWORK} \
                    --signer {NETWORK}-account \
                    --gas-limit 9999 \
                    --args-json '{json.dumps(args)}'"
                print(command)
                os.system(command)

        with open("./scripts/airdrop_output.json", "w") as output_file:
            json.dump(users, output_file)


if __name__ == "__main__":
    main()

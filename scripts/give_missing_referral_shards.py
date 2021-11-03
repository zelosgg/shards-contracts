import json
import os
import tempfile
from random import randrange

import psycopg2
from dotenv import dotenv_values
from rich import print

AIRDROP: str = "./cadence/transactions/airdrop.cdc"
CONN: str = dotenv_values(".env")["POSTGRES_CONNECTION"]

# Uncomment these to make the script work

# MAINNET
NETWORK: str = "mainnet"
RECEIVER: str = "8f6ab066b8b4e5c3"

# TESTNET
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


def get_users():
    with psycopg2.connect(CONN) as conn:
        cur = conn.cursor()
        cur.execute(
            """
                SELECT r_user.address
                FROM (select * from referrals where fulfilled_at is NULL) as referrals
                JOIN users r_user on r_user.id = referrer
                JOIN user_identity_verification i_user on i_user.user_id = invitee AND status ='clear'
            """
        )
        results = list(cur.fetchall())
    return [address[0] for address in results]


def main():
    addresses = get_users()
    with tempfile.NamedTemporaryFile(suffix=".cdc") as contract:
        compiled_contract = compile(NETWORK, AIRDROP).encode("utf-8")
        contract.write(compiled_contract)
        contract.read()

        address_mapping = []
        shard_mapping = []
        for user in addresses:
            address_mapping.append({"type": "Address", "value": "0x" + user})
            # address_mapping.append({"type": "Address", "value": "0x" + RECEIVER})
            shard_mapping.append({"type": "UInt32", "value": str(randrange(45))})

        for i in range(0, len(address_mapping), 300):
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


if __name__ == "__main__":
    main()

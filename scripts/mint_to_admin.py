import json
import os
import tempfile

from rich import print

MINT: str = "./cadence/transactions/mint-batch.cdc"

NETWORK: str = "mainnet"
# RECEIVER: str = "0x1f56a1e665826a52"
# RECEIVER: str = "0x8faeb9611819f062"  # derek mainnet
RECEIVER: str = "0xc97756439b51c842"  # hex mainnet

# NETWORK: str = "testnet"
# RECEIVER: str = "0x71db3ec2cdcea1f1"


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
    with tempfile.NamedTemporaryFile(suffix=".cdc") as contract:
        compiled_contract = compile(NETWORK, MINT).encode("utf-8")
        contract.write(compiled_contract)
        contract.read()
        for clip_id in range(1):
            args = [
                {"type": "Address", "value": RECEIVER},
                {"type": "UInt32", "value": str(clip_id)},
                {"type": "UInt64", "value": "1"},
            ]
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

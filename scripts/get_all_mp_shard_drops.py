import os
import re

from rich import print
from rich.console import Console

MINT: str = "./cadence/transactions/mint-batch.cdc"

# Uncomment some of these to make the script work

# MAINNET
NETWORK: str = "mainnet"
FROM: str = "0x1f56a1e665826a52"
CONTRACT: str = "82b54037a8f180cf"
LOWEST_BLOCK = 19200000
# LOWEST_BLOCK = 19430500

# TESTNET
# NETWORK: str = "testnet"


def main():
    console = Console()

    # Get block height
    command = f"flow blocks get latest --network {NETWORK}"
    block_height = os.popen(command).read()
    block_height = re.search("Height\s*([0-9]*)", block_height)
    block_height = block_height.group(1)
    block_height = int(block_height)

    distributed = []

    with console.status(f"[bold green]Fetching down to flow block {LOWEST_BLOCK}"):
        while block_height > LOWEST_BLOCK:
            scan_blocks = 1000
            command = f"""
                flow events get \
                A.{CONTRACT}.Shard.Withdraw \
                --network {NETWORK} \
                --start {block_height - scan_blocks} \
                --end {block_height}
            """
            events = os.popen(command).read()
            console.log(f"Fetched blocks {block_height - scan_blocks}")

            withdrawals = re.findall("([0-9]*)\s*.*from.*(0x[a-f0-9]*)", events)

            for withdrawal in withdrawals:
                if FROM in withdrawal:
                    distributed.append(withdrawal)

            block_height -= scan_blocks

        console.print("[bold]Total Distibuted Shards:", len(distributed))


if __name__ == "__main__":
    main()

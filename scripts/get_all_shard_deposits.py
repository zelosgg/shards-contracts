import os
import re

import psycopg2
from rich import print
from rich.console import Console

MINT: str = "./cadence/transactions/mint-batch.cdc"

# Uncomment some of these to make the script work

# MAINNET
NETWORK: str = "mainnet"
CONTRACT: str = "82b54037a8f180cf"
LOWEST_BLOCK = 19200000
# LOWEST_BLOCK = 19436500

# TESTNET
# NETWORK: str = "testnet"

CONN: str = ""


def fetch_addresses():
    with psycopg2.connect(CONN) as conn:
        cur = conn.cursor()
        cur.execute(
            """
                SELECT address
                FROM users
                WHERE address IS NOT NULL
            """
        )
        results = list(cur.fetchall())
    return [address[0] for address in results]


def main():
    console = Console()

    addresses = fetch_addresses()
    # append the eternal admin addresses
    addresses.append("1f56a1e665826a52")
    addresses.append("82b54037a8f180cf")

    # Get block height
    command = f"flow blocks get latest --network {NETWORK}"
    block_height = os.popen(command).read()
    block_height = re.search("Height\s*([0-9]*)", block_height)
    block_height = block_height.group(1)
    block_height = int(block_height)

    deposits = []
    withdrawals = []

    with console.status(f"[bold]Fetching down to flow block {LOWEST_BLOCK}"):
        while block_height > LOWEST_BLOCK:
            scan_blocks = 1000
            command = f"""
                flow events get \
                A.{CONTRACT}.Shard.Withdraw \
                A.{CONTRACT}.Shard.Deposit \
                --network {NETWORK} \
                --start {block_height - scan_blocks} \
                --end {block_height}
            """
            events = os.popen(command).read()
            console.log(f"Fetched blocks {block_height - scan_blocks}")

            deposits.append(re.findall("([0-9]*)\s*.*to.*0x([a-f0-9]*)", events))
            withdrawals.append(re.findall("([0-9]*)\s*.*from.*0x([a-f0-9]*)", events))

            block_height -= scan_blocks

    deposited = []

    # flatten the lists
    withdrawals = [item for sublist in withdrawals for item in sublist]
    deposits = [item for sublist in deposits for item in sublist]

    # if the withdrawal shard matches the deposit shard id
    for withdrawal in withdrawals:
        for deposit in deposits:
            if withdrawal[0] == deposit[0]:

                # and the deposit address belongs to eternal custodial wallet
                if deposit[1] in addresses:

                    # and the withdrawal was not from an eternal custodial wallet
                    if withdrawal[1] not in addresses:
                        deposited.append(deposit)

    console.print("[bold]Total Deposited Shards:", len(deposited))


if __name__ == "__main__":
    main()

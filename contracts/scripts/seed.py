"""
Campus Justice Protocol — StudioNet Seed Script
Phase 8: StudioNet Deployment

Seeds the deployed contract with:
  - Initial Nigerian universities (as institutions)
  - Admin role confirmation

Usage:
  python contracts/scripts/seed.py --network studionet --key $DEPLOYER_PRIVATE_KEY
  python contracts/scripts/seed.py --dry-run   (print transactions without sending)

The deployer wallet (--key) must be the contract admin.
Each institution wallet address must already exist — use placeholder addresses
that map to real institution wallets, or re-run with real addresses once they join.
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

ABI_PATH = Path(__file__).parent.parent / "abi" / "campus_justice_protocol.json"

# ── Initial institutions ──────────────────────────────────────────────────────
# Replace placeholder addresses with real institution wallet addresses.
# The domain is used for email verification (institution staff must sign up
# with an @domain email address to be matched to an institution).

INITIAL_INSTITUTIONS = [
    {
        "name": "University of Lagos",
        "domain": "unilag.edu.ng",
        "address": "0xINSTITUTION_UNILAG_00000000000000000001",
    },
    {
        "name": "Ahmadu Bello University",
        "domain": "abu.edu.ng",
        "address": "0xINSTITUTION_ABU_000000000000000000002",
    },
    {
        "name": "University of Nigeria, Nsukka",
        "domain": "unn.edu.ng",
        "address": "0xINSTITUTION_UNN_000000000000000000003",
    },
    {
        "name": "Obafemi Awolowo University",
        "domain": "oauife.edu.ng",
        "address": "0xINSTITUTION_OAU_000000000000000000004",
    },
    {
        "name": "University of Ibadan",
        "domain": "ui.edu.ng",
        "address": "0xINSTITUTION_UI_0000000000000000000005",
    },
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_abi() -> dict:
    with open(ABI_PATH) as f:
        return json.load(f)


def print_plan(abi: dict) -> None:
    print("\n" + "="*60)
    print("SEED PLAN (dry run)")
    print("="*60)
    print(f"Contract: {abi['contractAddress']}")
    print(f"Network:  {abi['network']}")
    print(f"Admin:    {abi['admin']}")
    print()
    print("Transactions to send:")
    for i, inst in enumerate(INITIAL_INSTITUTIONS, 1):
        print(f"  {i}. register_institution({inst['address'][:12]}…, '{inst['name']}', '{inst['domain']}')")
        print(f"     verify_institution({inst['address'][:12]}…)")
    print()
    print("To run for real: remove --dry-run and provide --key")
    print("="*60 + "\n")


async def seed(network: str, admin_key: str, contract_address: str) -> None:
    try:
        from genlayer import create_client, create_account
        from genlayer.chains import studionet, localnet
        from genlayer.types import TransactionStatus
    except ImportError:
        print("ERROR: genlayer SDK not installed.")
        print("  pip install genlayer-py")
        sys.exit(1)

    chain = studionet if network == "studionet" else localnet
    account = create_account(private_key=admin_key)
    client = create_client(chain=chain, account=account)

    print(f"\nSeeding {network} contract {contract_address}")
    print(f"Signer: {account.address}\n")

    # Confirm signer is admin
    role = await client.readContract(
        address=contract_address,
        function="get_role",
        args=[account.address],
    )
    if role != "ADMIN":
        print(f"ERROR: Signer {account.address} has role '{role}', expected 'ADMIN'.")
        sys.exit(1)

    for inst in INITIAL_INSTITUTIONS:
        print(f"Registering: {inst['name']} ({inst['domain']})")
        tx = await client.writeContract(
            address=contract_address,
            function="register_institution",
            args=[inst["address"], inst["name"], inst["domain"]],
        )
        await client.waitForTransactionReceipt(
            hash=tx, status=TransactionStatus.FINALIZED, retries=60, interval=5000
        )

        print(f"  Verifying: {inst['name']}")
        tx = await client.writeContract(
            address=contract_address,
            function="verify_institution",
            args=[inst["address"]],
        )
        await client.waitForTransactionReceipt(
            hash=tx, status=TransactionStatus.FINALIZED, retries=60, interval=5000
        )
        print(f"  ✓ {inst['name']} registered and verified\n")

    print("="*60)
    print("Seed complete. Verifying on-chain state…")
    raw = await client.readContract(
        address=contract_address,
        function="get_all_institutions",
        args=[],
    )
    institutions = json.loads(raw)
    print(f"Total institutions on-chain: {len(institutions)}")
    for inst in institutions:
        status = "verified" if inst.get("verified") else "UNVERIFIED"
        print(f"  [{status}] {inst.get('name')} ({inst.get('domain')})")
    print("="*60 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed CJP contract with initial institutions")
    parser.add_argument("--network",   choices=["studionet", "localnet"], default="studionet")
    parser.add_argument("--key",       default=os.getenv("DEPLOYER_PRIVATE_KEY"))
    parser.add_argument("--contract",  default=None, help="Override contract address from ABI")
    parser.add_argument("--dry-run",   action="store_true", help="Print plan without sending transactions")
    args = parser.parse_args()

    abi = load_abi()
    contract_address = args.contract or abi["contractAddress"]

    if args.dry_run:
        print_plan(abi)
        return

    if not args.key:
        print("ERROR: --key or DEPLOYER_PRIVATE_KEY env required")
        sys.exit(1)

    asyncio.run(seed(args.network, args.key, contract_address))


if __name__ == "__main__":
    main()

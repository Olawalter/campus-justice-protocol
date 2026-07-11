"""
Campus Justice Protocol — GenLayer Deployment Script
Phase 3: Contract Design

Usage:
  python contracts/scripts/deploy.py --network studionet --admin 0xYOUR_ADDRESS
  python contracts/scripts/deploy.py --network localnet  --admin 0xYOUR_ADDRESS

Requirements:
  pip install genlayer-js  (or use the GenLayer CLI)
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

CONTRACT_PATH = Path(__file__).parent.parent / "src" / "campus_justice_protocol.py"
ABI_OUT_PATH  = Path(__file__).parent.parent / "abi" / "campus_justice_protocol.json"


def read_contract_source() -> str:
    with open(CONTRACT_PATH, "r", encoding="utf-8") as f:
        return f.read()


async def deploy(network: str, admin_address: str, private_key: str):
    try:
        from genlayer import create_client, create_account
        from genlayer.chains import studionet, localnet
        from genlayer.types import TransactionStatus
    except ImportError:
        print("ERROR: genlayer SDK not installed.")
        print("  Install with: npm install -g genlayer  OR  pip install genlayer-js")
        sys.exit(1)

    chain = studionet if network == "studionet" else localnet
    account = create_account(private_key=private_key)
    client  = create_client(chain=chain, account=account)

    print(f"Deploying to {network}...")
    print(f"Admin address: {admin_address}")

    # Initialize consensus smart contract (required before deployment)
    await client.initializeConsensusSmartContract()

    source_code = read_contract_source()

    tx_hash = await client.deployContract(
        code=source_code,
        args=[admin_address],
        leaderOnly=False,
    )

    print(f"Deployment tx: {tx_hash}")
    print("Waiting for FINALIZED status...")

    receipt = await client.waitForTransactionReceipt(
        hash=tx_hash,
        status=TransactionStatus.FINALIZED,
        retries=100,
        interval=5000,
    )

    contract_address = receipt.get("contractAddress")
    print(f"\n✓ Contract deployed: {contract_address}")
    print(f"  Network: {network}")
    print(f"  Block:   {receipt.get('blockNumber')}")

    # Save ABI
    abi = {
        "contractAddress": contract_address,
        "network": network,
        "deployedAt": receipt.get("blockNumber"),
        "admin": admin_address,
        "methods": {
            "write": [
                "register_institution",
                "verify_institution",
                "register_student",
                "set_admin",
                "verify_case",
                "notify_institution",
                "create_case",
                "add_student_evidence",
                "file_appeal",
                "submit_response",
                "evaluate_case",
                "evaluate_appeal",
                "close_case",
            ],
            "view": [
                "get_case",
                "get_cases_by_student",
                "get_cases_by_institution",
                "get_cases_by_status",
                "get_institution_profile",
                "get_all_institutions",
                "get_precedents",
                "get_all_precedents",
                "get_transparency_stats",
                "get_role",
                "is_institution_verified",
                "get_case_judgment",
                "verify_evidence_hash",
                "get_institution_leaderboard",
            ],
        },
    }

    ABI_OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(ABI_OUT_PATH, "w") as f:
        json.dump(abi, f, indent=2)

    print(f"\n  ABI saved to: {ABI_OUT_PATH}")
    print("\nNext step: copy contract address to frontend/.env.local")
    print(f"  NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS={contract_address}")

    return contract_address


def main():
    parser = argparse.ArgumentParser(description="Deploy Campus Justice Protocol to GenLayer")
    parser.add_argument("--network",  choices=["studionet", "localnet"], default="studionet")
    parser.add_argument("--admin",    default="0xD9368922786222Ad59fA9C54769927C6DBddB109", help="Admin wallet address")
    parser.add_argument("--key",      default=os.getenv("DEPLOYER_PRIVATE_KEY"), help="Private key (or set DEPLOYER_PRIVATE_KEY env)")
    args = parser.parse_args()

    if not args.key:
        print("ERROR: Private key required. Use --key or set DEPLOYER_PRIVATE_KEY env var.")
        sys.exit(1)

    asyncio.run(deploy(args.network, args.admin, args.key))


if __name__ == "__main__":
    main()

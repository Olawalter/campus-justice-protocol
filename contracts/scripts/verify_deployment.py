"""
Campus Justice Protocol — Deployment Smoke Test
Phase 8: StudioNet Deployment

Verifies the deployed contract is live and responding correctly.
Does not modify state — read-only calls only.

Usage:
  python contracts/scripts/verify_deployment.py
  python contracts/scripts/verify_deployment.py --contract 0xNEW_ADDRESS --network localnet
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

ABI_PATH = Path(__file__).parent.parent / "abi" / "campus_justice_protocol.json"

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
WARN = "\033[93m!\033[0m"


def load_abi() -> dict:
    with open(ABI_PATH) as f:
        return json.load(f)


async def verify(network: str, contract_address: str, admin_address: str) -> bool:
    try:
        from genlayer import create_client
        from genlayer.chains import studionet, localnet
    except ImportError:
        print("ERROR: genlayer SDK not installed.  pip install genlayer-py")
        sys.exit(1)

    chain = studionet if network == "studionet" else localnet
    client = create_client(chain=chain)

    results = []

    async def check(label: str, fn, expected=None, transform=None):
        try:
            raw = await fn()
            val = transform(raw) if transform else raw
            if expected is not None:
                ok = val == expected
                symbol = PASS if ok else FAIL
                note = f"(got {val!r}, expected {expected!r})" if not ok else ""
            else:
                ok = val is not None
                symbol = PASS if ok else FAIL
                note = repr(val)[:80]
            print(f"  {symbol} {label}  {note}")
            results.append(ok)
            return val
        except Exception as e:
            print(f"  {FAIL} {label}  ERROR: {e}")
            results.append(False)
            return None

    print(f"\n{'='*60}")
    print(f"Campus Justice Protocol — Smoke Test")
    print(f"Contract: {contract_address}")
    print(f"Network:  {network}")
    print(f"Admin:    {admin_address}")
    print(f"{'='*60}\n")

    # ── 1. Admin role ─────────────────────────────────────────────────────────
    print("[1] Role management")
    await check(
        "Admin has ADMIN role",
        lambda: client.readContract(address=contract_address, function="get_role", args=[admin_address]),
        expected="ADMIN",
    )
    await check(
        "Unknown address returns UNREGISTERED",
        lambda: client.readContract(
            address=contract_address,
            function="get_role",
            args=["0x0000000000000000000000000000000000000000"],
        ),
        expected="UNREGISTERED",
    )

    # ── 2. Transparency stats ─────────────────────────────────────────────────
    print("\n[2] Transparency stats")
    raw_stats = await check(
        "get_transparency_stats returns valid JSON",
        lambda: client.readContract(address=contract_address, function="get_transparency_stats", args=[]),
        transform=lambda r: json.loads(r) if isinstance(r, str) else r,
    )
    if raw_stats:
        for field in ["total_cases", "institution_count", "precedent_count", "resolved_cases"]:
            present = field in raw_stats
            print(f"  {PASS if present else FAIL} stats.{field} present")
            results.append(present)

    # ── 3. Institutions ───────────────────────────────────────────────────────
    print("\n[3] Institution registry")
    raw_insts = await check(
        "get_all_institutions returns JSON array",
        lambda: client.readContract(address=contract_address, function="get_all_institutions", args=[]),
        transform=lambda r: json.loads(r) if isinstance(r, str) else r,
    )
    if raw_insts is not None:
        count = len(raw_insts)
        print(f"  {PASS if count > 0 else WARN} {count} institution(s) registered  {'(run seed.py to add some)' if count == 0 else ''}")
        results.append(True)

    # ── 4. Leaderboard ────────────────────────────────────────────────────────
    print("\n[4] Leaderboard")
    await check(
        "get_institution_leaderboard returns JSON",
        lambda: client.readContract(address=contract_address, function="get_institution_leaderboard", args=[]),
        transform=lambda r: json.loads(r) if isinstance(r, str) else r,
    )

    # ── 5. Precedents ─────────────────────────────────────────────────────────
    print("\n[5] Precedents")
    await check(
        "get_all_precedents(10) returns JSON",
        lambda: client.readContract(address=contract_address, function="get_all_precedents", args=[10]),
        transform=lambda r: json.loads(r) if isinstance(r, str) else r,
    )

    # ── 6. Nonexistent case ───────────────────────────────────────────────────
    print("\n[6] Edge cases")
    await check(
        "get_case(nonexistent) returns empty string",
        lambda: client.readContract(address=contract_address, function="get_case", args=["CJP-999999"]),
        expected="",
    )
    await check(
        "verify_evidence_hash(nonexistent) returns False",
        lambda: client.readContract(
            address=contract_address,
            function="verify_evidence_hash",
            args=["CJP-999999", "deadbeef"],
        ),
        expected=False,
    )
    await check(
        "is_institution_verified(unknown) returns False",
        lambda: client.readContract(
            address=contract_address,
            function="is_institution_verified",
            args=["0x0000000000000000000000000000000000000000"],
        ),
        expected=False,
    )

    # ── Summary ───────────────────────────────────────────────────────────────
    total = len(results)
    passed = sum(results)
    failed = total - passed
    print(f"\n{'='*60}")
    print(f"Results: {passed}/{total} checks passed")
    if failed:
        print(f"{FAIL} {failed} check(s) failed")
    else:
        print(f"{PASS} All checks passed — contract is live and functioning correctly")
    print(f"{'='*60}\n")

    return failed == 0


def main() -> None:
    abi = load_abi()
    parser = argparse.ArgumentParser(description="Smoke-test the deployed CJP contract")
    parser.add_argument("--network",   choices=["studionet", "localnet"], default=abi.get("network", "studionet"))
    parser.add_argument("--contract",  default=abi["contractAddress"])
    parser.add_argument("--admin",     default=abi["admin"])
    args = parser.parse_args()

    ok = asyncio.run(verify(args.network, args.contract, args.admin))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()

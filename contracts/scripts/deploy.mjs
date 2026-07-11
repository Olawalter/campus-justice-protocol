/**
 * CJP Contract Deployment Script
 * Uses genlayer-js to deploy campus_justice_protocol.py to StudioNet.
 *
 * Usage (generate a fresh funded account):
 *   node contracts/scripts/deploy.mjs
 *
 * Usage (provide existing admin private key):
 *   node contracts/scripts/deploy.mjs --key <ADMIN_PRIVATE_KEY>
 *
 * After deployment, updates:
 *   - contracts/abi/campus_justice_protocol.json
 *   - frontend/.env.local
 */

import { createClient, createAccount, generatePrivateKey, chains } from 'genlayer-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const args = process.argv.slice(2)
const keyIdx = args.indexOf('--key')
const providedKey = keyIdx !== -1 ? args[keyIdx + 1] : null

const chain = {
  ...chains.studionet,
  rpcUrls: {
    ...chains.studionet.rpcUrls,
    default: { http: ['https://studio.genlayer.com/api'] },
  },
}

async function deploy() {
  let privateKey

  if (providedKey) {
    privateKey = providedKey.startsWith('0x') ? providedKey : `0x${providedKey}`
    console.log('Using provided private key.')
  } else {
    console.log('No --key provided. Generating a fresh account and funding it on StudioNet…')
    privateKey = generatePrivateKey()
    const acc = createAccount(privateKey)
    console.log(`  New admin address: ${acc.address}`)
    console.log(`  Private key: ${privateKey}`)
    console.log('  (Save this private key if you want to reuse the admin account)\n')

    // Fund on studionet
    const fundClient = createClient({ chain })
    try {
      await fundClient.fundAccount({ address: acc.address, amount: BigInt('1000000000000000000') })
      console.log('  Funded ✓')
    } catch (e) {
      console.warn(`  Fund attempt response: ${e.message} (may already be funded or faucet unavailable)`)
    }
  }

  const account = createAccount(privateKey)
  const client = createClient({ chain, account })

  const contractCode = readFileSync(join(ROOT, 'src', 'campus_justice_protocol.py'), 'utf-8')

  console.log(`\nDeploying CampusJusticeProtocol…`)
  console.log(`  Admin: ${account.address}`)

  const hash = await client.deployContract({
    code: contractCode,
    args: [account.address],
    leaderOnly: false,
  })

  console.log(`\nTx hash: ${hash}`)
  console.log('Waiting for finalization (this may take 1–3 minutes)…')

  const receipt = await client.waitForTransactionReceipt({
    hash,
    retries: 120,
    interval: 5000,
  })

  const contractAddress =
    receipt?.data?.contract_address ??
    receipt?.contractAddress ??
    receipt?.data?.deployment?.contract_address ??
    (receipt?.to === null ? receipt?.data : null)

  if (!contractAddress) {
    console.log('\nFull receipt:', JSON.stringify(receipt, null, 2))
    console.error('\nCould not extract contract address. Check receipt above.')
    process.exit(1)
  }

  console.log(`\n✓ Deployed at: ${contractAddress}`)

  // Update ABI
  const abiPath = join(ROOT, 'abi', 'campus_justice_protocol.json')
  const abi = JSON.parse(readFileSync(abiPath, 'utf-8'))
  abi.contractAddress = contractAddress
  abi.deployedAt = new Date().toISOString()
  abi.admin = account.address
  writeFileSync(abiPath, JSON.stringify(abi, null, 2))
  console.log(`✓ Updated abi/campus_justice_protocol.json`)

  // Update frontend .env.local
  const envPath = join(ROOT, '..', 'frontend', '.env.local')
  let env = readFileSync(envPath, 'utf-8')
  env = env.replace(
    /^NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=.*/m,
    `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=${contractAddress}`
  )
  env = env.replace(
    /^NEXT_PUBLIC_ADMIN_ADDRESS=.*/m,
    `NEXT_PUBLIC_ADMIN_ADDRESS=${account.address}`
  )
  writeFileSync(envPath, env)
  console.log(`✓ Updated frontend/.env.local`)

  console.log('\n=== Deployment complete! ===')
  console.log(`  Contract: ${contractAddress}`)
  console.log(`  Admin:    ${account.address}`)
  console.log(`  Private:  ${privateKey}`)
  console.log('\nNext steps:')
  console.log('  1. Save the private key above securely')
  console.log('  2. Restart the Next.js dev server to pick up the new contract address')
  console.log('  3. Run: node contracts/scripts/seed.mjs  (if seeding institutions)')
}

deploy().catch((err) => {
  console.error('\nDeployment failed:', err?.message ?? err)
  process.exit(1)
})

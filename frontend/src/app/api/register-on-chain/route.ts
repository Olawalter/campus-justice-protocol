import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAccount, chains } from 'genlayer-js'

const ADMIN_KEY = process.env.GENLAYER_ADMIN_PRIVATE_KEY as `0x${string}` | undefined
const CONTRACT = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS as `0x${string}`
const RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? 'https://studio.genlayer.com/api'

// ── Simple in-memory rate limiter ────────────────────────────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_WINDOW = 60_000
const RATE_LIMIT = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

function getAdminClient() {
  if (!ADMIN_KEY) throw new Error('Admin key not configured')
  const account = createAccount(ADMIN_KEY)
  const chain = {
    ...chains.studionet,
    rpcUrls: { ...chains.studionet.rpcUrls, default: { http: [RPC] } },
  }
  return createClient({ chain, account })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  try {
    const { walletAddress, role } = await req.json()

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 })
    }

    if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 })
    }

    const client = getAdminClient()

    if (role === 'student') {
      const hash = await client.writeContract({
        address: CONTRACT,
        functionName: 'register_student',
        args: [walletAddress],
        value: BigInt(0),
      })
      return NextResponse.json({ success: true, hash: String(hash) })
    }

    return NextResponse.json({ success: true, hash: '' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('register-on-chain error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

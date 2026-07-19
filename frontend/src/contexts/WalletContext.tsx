'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { createClient } from 'genlayer-js'
import { getChain, getNetworkName, RPC_URL, CHAIN_ID } from '@/lib/genlayer'
import { CONTRACT_ADDRESS } from '@/lib/constants'
import { TransactionStatus } from 'genlayer-js/types'

interface WalletContextValue {
  address: string | null
  connected: boolean
  connecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  fileCase: (args: FileCaseArgs) => Promise<string>
  submitResponse: (caseId: string, responseText: string) => Promise<string>
  requestJudgment: (caseId: string) => Promise<string>
  fileAppeal: (caseId: string, grounds: string) => Promise<string>
  requestAppealJudgment: (caseId: string) => Promise<string>
  txPending: boolean
  txHash: string | null
}

interface FileCaseArgs {
  caseType: string
  title: string
  description: string
  evidenceRefs: string[]
  matricNumber: string
  department: string
  policyUrl?: string
}

const WalletContext = createContext<WalletContextValue | null>(null)

// Switch MetaMask to GenLayer network using standard EIP-3326/EIP-3085
// Avoids genlayer-js client.connect() which calls wallet_getSnaps (unsupported)
async function switchToGenLayer() {
  if (typeof window === 'undefined' || !window.ethereum) return
  const chainIdHex = `0x${CHAIN_ID.toString(16)}`
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
  } catch (err: unknown) {
    // 4902 = chain not added yet
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: CHAIN_ID === 61999 ? 'GenLayer Studionet' : 'GenLayer Testnet Asimov',
          rpcUrls: [RPC_URL],
          nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
        }],
      })
    } else {
      throw err
    }
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txPending, setTxPending] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Auto-reconnect on reload
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    window.ethereum.request({ method: 'eth_accounts' }).then((result: unknown) => {
      const accounts = result as string[]
      if (accounts[0]) setAddress(accounts[0])
    }).catch(() => {})

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[]
      setAddress(accounts[0] ?? null)
    }
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    return () => window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
  }, [])

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No wallet detected. Install MetaMask or Rabby.')
      return
    }
    setConnecting(true)
    setError(null)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      setAddress(accounts[0])
      await switchToGenLayer()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to connect wallet'
      setError(msg)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setTxHash(null)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function writeContract(functionName: string, args: any[]): Promise<string> {
    if (!address) throw new Error('Wallet not connected')
    if (typeof window === 'undefined' || !window.ethereum) throw new Error('No wallet detected')

    setTxPending(true)
    setTxHash(null)
    try {
      // Ensure wallet is on the correct network first
      await switchToGenLayer()

      // Create client with injected provider so MetaMask handles signing
      const client = createClient({
        chain: getChain(),
        account: address as `0x${string}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: window.ethereum as any,
      })

      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
        value: BigInt(0),
      }) as string

      setTxHash(hash)

      // For judgment calls (LLM-based), validators take several minutes.
      // We return the hash immediately and let the UI poll for state changes.
      // For simple writes (file_case, submit_response, file_appeal), wait for finalization.
      const isJudgmentCall = functionName === 'request_judgment' || functionName === 'request_appeal_judgment'
      if (!isJudgmentCall) {
        await client.waitForTransactionReceipt({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hash: hash as any,
          status: TransactionStatus.FINALIZED,
          retries: 60,
          interval: 3000,
        })
      }
      return hash
    } catch (e) {
      const msg = e instanceof Error
        ? e.message
        : (typeof e === 'object' && e !== null && 'message' in e)
          ? String((e as { message: unknown }).message)
          : JSON.stringify(e)
      throw new Error(msg)
    } finally {
      setTxPending(false)
    }
  }

  const fileCase = async (args: FileCaseArgs) =>
    writeContract('file_case', [
      args.caseType, args.title, args.description,
      JSON.stringify(args.evidenceRefs), args.matricNumber, args.department,
      String(Date.now()),
      args.policyUrl?.trim() ?? '',
    ])

  const submitResponse = async (caseId: string, responseText: string) =>
    writeContract('submit_response', [caseId, responseText])

  const requestJudgment = async (caseId: string) =>
    writeContract('request_judgment', [caseId])

  const fileAppeal = async (caseId: string, grounds: string) =>
    writeContract('file_appeal', [caseId, grounds])

  const requestAppealJudgment = async (caseId: string) =>
    writeContract('request_appeal_judgment', [caseId])

  return (
    <WalletContext.Provider value={{
      address,
      connected: !!address,
      connecting,
      error,
      connect,
      disconnect,
      fileCase,
      submitResponse,
      requestJudgment,
      fileAppeal,
      requestAppealJudgment,
      txPending,
      txHash,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}

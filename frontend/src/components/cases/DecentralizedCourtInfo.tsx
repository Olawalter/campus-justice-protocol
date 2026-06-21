import { Network, Lock } from 'lucide-react'

const CONTRACT =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ??
  '0x840A8Fc23404F48983413c7C2c27e077FF360321'

export function DecentralizedCourtInfo() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Network className="h-3.5 w-3.5 text-blue-500" />
        </div>
        <p className="font-medium text-foreground text-sm">Decentralized Court</p>
      </div>

      <div className="space-y-2.5 text-xs">
        <div>
          <p className="text-muted-foreground mb-0.5">Network</p>
          <p className="font-medium text-foreground">GenLayer StudioNet</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">Smart Contract</p>
          <p className="font-mono text-foreground break-all">
            {CONTRACT.slice(0, 10)}…{CONTRACT.slice(-8)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">Validator Nodes</p>
          <p className="font-medium text-foreground">5 AI-powered nodes</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">Consensus Threshold</p>
          <p className="font-medium text-foreground">≥60% agreement required</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">Arbitration Model</p>
          <p className="font-medium text-foreground">LLM + optimistic execution</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-blue-500 border-t border-border pt-2">
        <Lock className="h-3 w-3" />
        <span>All judgments immutably stored on-chain</span>
      </div>
    </div>
  )
}

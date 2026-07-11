import { FileCaseForm } from '@/components/cases/FileCaseForm'

export default function FilePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">File a Case</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Your case will be evaluated by GenLayer AI validators and decided by on-chain consensus.
        </p>
      </div>
      <FileCaseForm />
    </div>
  )
}

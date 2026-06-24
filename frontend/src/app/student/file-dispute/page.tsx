'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, X, FileText, AlertCircle, CheckCircle2, Search, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { useCaseFiling } from '@/hooks/useCase'
import { DISPUTE_TYPES } from '@/config/constants'
import { DisputeType } from '@/types'

interface InstitutionEntry {
  address: string
  name: string
  region: string
}

const INSTITUTIONS: InstitutionEntry[] = [
  // ── Nigeria ──────────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000001', name: 'University of Lagos (UNILAG)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000002', name: 'Ahmadu Bello University (ABU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000003', name: 'University of Ibadan (UI)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000004', name: 'University of Nigeria, Nsukka (UNN)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000005', name: 'Obafemi Awolowo University (OAU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000006', name: 'University of Benin (UNIBEN)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000007', name: 'University of Ilorin (UNILORIN)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000008', name: 'University of Port Harcourt (UNIPORT)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000009', name: 'Federal University of Technology, Minna (FUTMINNA)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000a', name: 'Covenant University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000b', name: 'Babcock University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000c', name: 'Lagos State University (LASU)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000d', name: 'Federal University of Technology, Akure (FUTA)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000e', name: 'University of Calabar (UNICAL)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000000f', name: 'Bayero University, Kano (BUK)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000010', name: 'Nnamdi Azikiwe University (UNIZIK)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000011', name: 'University of Jos (UNIJOS)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000012', name: 'University of Maiduguri (UNIMAID)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000013', name: 'Federal University, Oye-Ekiti (FUOYE)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000014', name: 'Rivers State University (RSU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000015', name: 'Ladoke Akintola University of Technology (LAUTECH)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000016', name: 'Abia State University (ABSU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000017', name: 'Ekiti State University (EKSU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000018', name: 'Imo State University (IMSU)', region: 'Nigeria' },
  { address: '0x0000000000000000000000000000000000000019', name: 'Delta State University (DELSU)', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001a', name: 'Pan-Atlantic University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001b', name: 'Bowen University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001c', name: "Redeemer's University", region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001d', name: 'Landmark University', region: 'Nigeria' },
  { address: '0x000000000000000000000000000000000000001e', name: 'Afe Babalola University (ABUAD)', region: 'Nigeria' },

  // ── United States ────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000101', name: 'Harvard University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000102', name: 'Massachusetts Institute of Technology (MIT)', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000103', name: 'Stanford University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000104', name: 'University of California, Berkeley (UC Berkeley)', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000105', name: 'Columbia University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000106', name: 'Yale University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000107', name: 'Princeton University', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000108', name: 'University of Chicago', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000109', name: 'New York University (NYU)', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010a', name: 'University of California, Los Angeles (UCLA)', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010b', name: 'University of Michigan', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010c', name: 'University of Pennsylvania (UPenn)', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010d', name: 'Duke University', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010e', name: 'Georgia Institute of Technology (Georgia Tech)', region: 'United States' },
  { address: '0x000000000000000000000000000000000000010f', name: 'University of Texas at Austin', region: 'United States' },
  { address: '0x0000000000000000000000000000000000000110', name: 'Howard University', region: 'United States' },

  // ── United Kingdom ───────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000201', name: 'University of Oxford', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000202', name: 'University of Cambridge', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000203', name: 'Imperial College London', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000204', name: 'University College London (UCL)', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000205', name: "King's College London", region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000206', name: 'London School of Economics (LSE)', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000207', name: 'University of Edinburgh', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000208', name: 'University of Manchester', region: 'United Kingdom' },
  { address: '0x0000000000000000000000000000000000000209', name: 'University of Birmingham', region: 'United Kingdom' },
  { address: '0x000000000000000000000000000000000000020a', name: 'University of Leeds', region: 'United Kingdom' },
  { address: '0x000000000000000000000000000000000000020b', name: 'University of Warwick', region: 'United Kingdom' },
  { address: '0x000000000000000000000000000000000000020c', name: 'University of Bristol', region: 'United Kingdom' },

  // ── Europe ───────────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000301', name: 'ETH Zurich (Switzerland)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000302', name: 'Sorbonne University (France)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000303', name: 'Technical University of Munich (Germany)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000304', name: 'University of Amsterdam (Netherlands)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000305', name: 'Karolinska Institute (Sweden)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000306', name: 'University of Copenhagen (Denmark)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000307', name: 'Ludwig Maximilian University of Munich (Germany)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000308', name: 'Sapienza University of Rome (Italy)', region: 'Europe' },
  { address: '0x0000000000000000000000000000000000000309', name: 'University of Barcelona (Spain)', region: 'Europe' },
  { address: '0x000000000000000000000000000000000000030a', name: 'KU Leuven (Belgium)', region: 'Europe' },
  { address: '0x000000000000000000000000000000000000030b', name: 'Delft University of Technology (Netherlands)', region: 'Europe' },
  { address: '0x000000000000000000000000000000000000030c', name: 'University of Helsinki (Finland)', region: 'Europe' },

  // ── Canada ───────────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000401', name: 'University of Toronto', region: 'Canada' },
  { address: '0x0000000000000000000000000000000000000402', name: 'McGill University', region: 'Canada' },
  { address: '0x0000000000000000000000000000000000000403', name: 'University of British Columbia (UBC)', region: 'Canada' },
  { address: '0x0000000000000000000000000000000000000404', name: 'University of Waterloo', region: 'Canada' },
  { address: '0x0000000000000000000000000000000000000405', name: 'University of Alberta', region: 'Canada' },

  // ── Asia & Oceania ───────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000501', name: 'National University of Singapore (NUS)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000502', name: 'University of Tokyo (Japan)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000503', name: 'Tsinghua University (China)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000504', name: 'University of Melbourne (Australia)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000505', name: 'University of Sydney (Australia)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000506', name: 'Seoul National University (South Korea)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000507', name: 'Indian Institute of Technology, Bombay (IIT Bombay)', region: 'Asia & Oceania' },
  { address: '0x0000000000000000000000000000000000000508', name: 'University of Hong Kong (HKU)', region: 'Asia & Oceania' },

  // ── Africa (outside Nigeria) ─────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000601', name: 'University of Cape Town (South Africa)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000602', name: 'University of Witwatersrand (South Africa)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000603', name: 'University of Ghana, Legon', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000604', name: 'Makerere University (Uganda)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000605', name: 'University of Nairobi (Kenya)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000606', name: 'Cairo University (Egypt)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000607', name: 'Stellenbosch University (South Africa)', region: 'Africa' },
  { address: '0x0000000000000000000000000000000000000608', name: 'Addis Ababa University (Ethiopia)', region: 'Africa' },

  // ── South America ────────────────────────────────────────────────────────────
  { address: '0x0000000000000000000000000000000000000701', name: 'University of São Paulo (USP, Brazil)', region: 'South America' },
  { address: '0x0000000000000000000000000000000000000702', name: 'University of Buenos Aires (Argentina)', region: 'South America' },
  { address: '0x0000000000000000000000000000000000000703', name: 'Pontificia Universidad Católica de Chile', region: 'South America' },
]

const CUSTOM_ADDRESS = '__CUSTOM__'

function FileDisputeContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { submitCase, submitting, error, evidence } = useCaseFiling()

  const [institution, setInstitution] = useState('')
  const [customInstitution, setCustomInstitution] = useState('')
  const [institutionEmail, setInstitutionEmail] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [disputeType, setDisputeType] = useState<DisputeType | ''>('')
  const [description, setDescription] = useState('')
  const [matricNumber, setMatricNumber] = useState(user?.matricNumber ?? '')
  const [department, setDepartment] = useState(user?.department ?? '')
  const [submitted, setSubmitted] = useState<string | null>(null)

  const isCustom = institution === CUSTOM_ADDRESS

  const selectedName = useMemo(() => {
    if (isCustom) return customInstitution
    return INSTITUTIONS.find((i) => i.address === institution)?.name ?? ''
  }, [institution, customInstitution, isCustom])

  const filteredInstitutions = useMemo(() => {
    if (!searchQuery.trim()) return INSTITUTIONS
    const q = searchQuery.toLowerCase()
    return INSTITUTIONS.filter(
      (i) => i.name.toLowerCase().includes(q) || i.region.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const groupedFiltered = useMemo(() => {
    const groups: Record<string, InstitutionEntry[]> = {}
    for (const inst of filteredInstitutions) {
      if (!groups[inst.region]) groups[inst.region] = []
      groups[inst.region].push(inst)
    }
    return groups
  }, [filteredInstitutions])

  function selectInstitution(address: string) {
    setInstitution(address)
    setShowDropdown(false)
    setSearchQuery('')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      evidence.addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((!institution || (isCustom && !customInstitution)) || !disputeType) return
    try {
      const caseId = await submitCase({
        institution: isCustom ? CUSTOM_ADDRESS : institution,
        institutionName: selectedName,
        institutionEmail,
        disputeType: disputeType as DisputeType,
        description,
        evidenceFiles: evidence.files,
        matricNumber,
        department,
      })
      setSubmitted(caseId)
    } catch {
      // error shown via hook
    }
  }

  if (submitted) {
    return (
      <PageWrapper role="student" userName={user?.displayName}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Case Submitted</h2>
          <p className="text-muted-foreground mb-2">Your dispute has been filed on GenLayer.</p>
          <p className="text-sm font-mono text-secondary mb-8">{submitted}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
              Back to Dashboard
            </Button>
            <Button className="bg-secondary hover:bg-secondary/90 text-white" onClick={() => router.push(`/student/cases/${submitted}`)}>
              View Case
            </Button>
          </div>
        </motion.div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper role="student" userName={user?.displayName}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">File a Dispute</h1>
          <p className="text-muted-foreground mt-1">Submit your case for AI-assisted arbitration on GenLayer.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-2xl p-6">
          {/* Institution selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Institution</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <span className={selectedName ? 'text-foreground' : 'text-muted-foreground'}>
                  {selectedName || 'Select institution…'}
                </span>
                <svg className={`h-4 w-4 text-muted-foreground transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {showDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search institutions or regions…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1">
                    {Object.entries(groupedFiltered).map(([region, insts]) => (
                      <div key={region}>
                        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">
                          {region}
                        </div>
                        {insts.map((inst) => (
                          <button
                            key={inst.address}
                            type="button"
                            onClick={() => selectInstitution(inst.address)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary/10 transition-colors ${institution === inst.address ? 'bg-secondary/10 text-secondary font-medium' : 'text-foreground'}`}
                          >
                            {inst.name}
                          </button>
                        ))}
                      </div>
                    ))}

                    {filteredInstitutions.length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No institutions match &quot;{searchQuery}&quot;
                      </div>
                    )}

                    <div className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => selectInstitution(CUSTOM_ADDRESS)}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-secondary/10 transition-colors flex items-center gap-2 ${isCustom ? 'bg-secondary/10 text-secondary font-medium' : 'text-foreground'}`}
                      >
                        <span className="text-lg leading-none">+</span>
                        My institution is not listed
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isCustom && (
              <Input
                placeholder="Enter your institution name (e.g. University of Oxford)"
                value={customInstitution}
                onChange={(e) => setCustomInstitution(e.target.value)}
                className="mt-2"
                required
                autoFocus
              />
            )}
          </div>

          {/* Institution email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Institution Email <span className="text-muted-foreground font-normal text-xs">(for direct notification)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                type="email"
                placeholder="registrar@university.edu"
                value={institutionEmail}
                onChange={(e) => setInstitutionEmail(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the email of the registrar, dean, or student affairs office. They will receive an immediate email notification about this case.
            </p>
          </div>

          {/* Dispute type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Dispute Type</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
              value={disputeType}
              onChange={(e) => setDisputeType(e.target.value as DisputeType)}
              required
            >
              <option value="">Select dispute type…</option>
              {DISPUTE_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>

          {/* Student ID + Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Student ID / Matric Number</label>
              <Input
                placeholder="190404001"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Department / Faculty</label>
              <Input
                placeholder="Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Description <span className="text-muted-foreground text-xs">(min. 50 characters)</span>
            </label>
            <Textarea
              placeholder="Describe your dispute in detail. Include dates, relevant academic records, and what resolution you are seeking…"
              className="min-h-[140px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={50}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length} / 50 min</p>
          </div>

          {/* Evidence upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Evidence Files <span className="text-muted-foreground text-xs">(max 10, 10MB each)</span>
            </label>

            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload PDFs, images, or documents</span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {evidence.files.length > 0 && (
              <div className="space-y-2 mt-2">
                {evidence.files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    {evidence.uploading && (
                      <div className="w-16">
                        <Progress value={evidence.progress[i] ?? 0} className="h-1" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => evidence.removeFile(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notice */}
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
            By submitting, your case is recorded on GenLayer and cannot be deleted. Evidence files are hashed client-side — only the SHA-256 hash is stored on-chain.
          </p>

          <Button
            type="submit"
            disabled={submitting || !user?.walletAddress}
            className="w-full bg-secondary hover:bg-secondary/90 text-white h-11"
          >
            {submitting
              ? `Submitting… ${evidence.uploading ? `(uploading ${evidence.overallProgress}%)` : '(signing…)'}`
              : !user?.walletAddress
              ? 'Preparing wallet…'
              : 'Submit Dispute to GenLayer'}
          </Button>
        </form>
      </div>
    </PageWrapper>
  )
}

export default function FileDisputePage() {
  return (
    <AuthGuard requiredRole="STUDENT">
      <FileDisputeContent />
    </AuthGuard>
  )
}

/**
 * Campus Justice Protocol — GenLayer Contract Service
 * Typed wrappers around every contract method.
 * Uses the genLayerClient for all JSON-RPC calls.
 */

import { callView, callWrite } from './client'
import {
  Case,
  InstitutionProfile,
  Judgment,
  TransparencyStats,
  WalletCaller,
} from '@/types'

// ── Type mappers ──────────────────────────────────────────────────────────────

function str(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((item) => str(item))
}

function num(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') return Number(v) || 0
  return 0
}

function mapCase(raw: Record<string, unknown>): Case {
  const judgment = raw.judgment ?? raw.appeal_judgment
  return {
    caseId:           str(raw.case_id),
    filer:            str(raw.filer),
    institution:      str(raw.institution),
    institutionName:  str(raw.institution_name) || undefined,
    disputeType:      str(raw.dispute_type) as Case['disputeType'],
    description:      str(raw.description),
    status:           str(raw.status) as Case['status'],
    createdAt:        num(raw.created_at),
    updatedAt:        num(raw.updated_at),
    evidenceHashes:   strArray(raw.evidence_hashes),
    responseHashes:   strArray(raw.response_hashes),
    judgment:         judgment && typeof judgment === 'object' ? mapJudgment(judgment as Record<string, unknown>) : undefined,
    appeal:           raw.appeal && typeof raw.appeal === 'object' ? {
      appellant: str((raw.appeal as Record<string, unknown>).appellant),
      grounds: str((raw.appeal as Record<string, unknown>).grounds),
      filedAt: num((raw.appeal as Record<string, unknown>).filed_at),
      outcome: raw.appeal_judgment && typeof raw.appeal_judgment === 'object'
        ? mapJudgment(raw.appeal_judgment as Record<string, unknown>)
        : undefined,
    } : undefined,
    precedentRefs:    strArray(raw.precedent_refs),
    matricNumber:     str(raw.matric_number) || undefined,
    department:       str(raw.department) || undefined,
  }
}

function mapJudgment(raw: Record<string, unknown>): Judgment {
  const confidence = num(raw.confidence_score)
  return {
    outcome:           str(raw.outcome) as Judgment['outcome'],
    reasoning:         str(raw.reasoning),
    evidenceSummary:   str(raw.evidence_summary),
    confidenceScore:   confidence,
    validatorConsensus: {
      totalValidators:    5,
      agreeingValidators: Math.round(confidence * 5),
      consensusReached:   confidence >= 0.6,
      rounds:             1,
    },
    issuedAt: num(raw.issued_at),
  }
}

function mapInstitutionProfile(raw: Record<string, unknown>): InstitutionProfile {
  return {
    address:           raw.address as string,
    name:              raw.name as string,
    domain:            raw.domain as string,
    verified:          raw.verified as boolean,
    reputationScore:   raw.reputation_score as number,
    totalCases:        raw.total_cases as number,
    resolvedCases:     raw.resolved_cases as number,
    appealSuccessRate: raw.appeal_success_rate as number,
    avgResolutionDays: raw.avg_resolution_days as number,
  }
}

// ── Admin methods ─────────────────────────────────────────────────────────────

export async function registerInstitution(
  caller: WalletCaller,
  institutionAddress: string,
  name: string,
  domain: string
) {
  return callWrite(caller.privateKey, 'register_institution', [institutionAddress, name, domain])
}

export async function verifyInstitution(caller: WalletCaller, institutionAddress: string) {
  return callWrite(caller.privateKey, 'verify_institution', [institutionAddress])
}

export async function registerStudent(caller: WalletCaller, studentAddress: string) {
  return callWrite(caller.privateKey, 'register_student', [studentAddress])
}

export async function verifyCase(caller: WalletCaller, caseId: string) {
  return callWrite(caller.privateKey, 'verify_case', [caseId])
}

export async function notifyInstitution(caller: WalletCaller, caseId: string) {
  return callWrite(caller.privateKey, 'notify_institution', [caseId])
}

// ── Student methods ───────────────────────────────────────────────────────────

export async function createCase(
  caller: WalletCaller,
  params: {
    institutionAddress: string
    disputeType: string
    description: string
    evidenceHashes: string[]
    matricNumber: string
    department: string
  }
) {
  return callWrite(caller.privateKey, 'create_case', [
    params.institutionAddress,
    params.disputeType,
    params.description,
    JSON.stringify(params.evidenceHashes),
    params.matricNumber,
    params.department,
  ])
}

export async function addStudentEvidence(caller: WalletCaller, caseId: string, hashes: string[]) {
  return callWrite(caller.privateKey, 'add_student_evidence', [caseId, JSON.stringify(hashes)])
}

export async function fileAppeal(caller: WalletCaller, caseId: string, grounds: string) {
  return callWrite(caller.privateKey, 'file_appeal', [caseId, grounds])
}

// ── Institution methods ───────────────────────────────────────────────────────

export async function submitResponse(
  caller: WalletCaller,
  caseId: string,
  responseText: string,
  responseHashes: string[]
) {
  return callWrite(caller.privateKey, 'submit_response', [caseId, responseText, JSON.stringify(responseHashes)])
}

// ── AI evaluation methods ─────────────────────────────────────────────────────

export async function evaluateCase(caller: WalletCaller, caseId: string) {
  return callWrite(caller.privateKey, 'evaluate_case', [caseId])
}

export async function evaluateAppeal(caller: WalletCaller, caseId: string) {
  return callWrite(caller.privateKey, 'evaluate_appeal', [caseId])
}

export async function closeCase(caller: WalletCaller, caseId: string) {
  return callWrite(caller.privateKey, 'close_case', [caseId])
}

// ── View methods ──────────────────────────────────────────────────────────────

function parseJsonResult<T>(raw: unknown): T {
  if (raw == null) throw new Error('Empty contract response')
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed || trimmed === '""' || trimmed === "''") throw new Error('Empty contract response')
    return JSON.parse(trimmed) as T
  }
  return raw as T
}

export async function getCase(caseId: string): Promise<Case> {
  const raw = await callView('get_case', [caseId])
  if (raw == null || raw === '' || raw === '""') {
    throw new Error(`Case not found: ${caseId}`)
  }
  const parsed = parseJsonResult<Record<string, unknown>>(raw)
  if (!parsed || typeof parsed !== 'object' || !parsed.case_id) {
    throw new Error(`Case not found: ${caseId}`)
  }
  return mapCase(parsed)
}

export async function getCasesByStudent(studentAddress: string): Promise<Case[]> {
  const raw = await callView('get_cases_by_student', [studentAddress])
  return parseJsonResult<Record<string, unknown>[]>(raw).map(mapCase)
}

export async function getCasesByInstitution(institutionAddress: string): Promise<Case[]> {
  const raw = await callView('get_cases_by_institution', [institutionAddress])
  return parseJsonResult<Record<string, unknown>[]>(raw).map(mapCase)
}

export async function getCasesByStatus(status: string): Promise<Case[]> {
  const raw = await callView('get_cases_by_status', [status])
  return parseJsonResult<Record<string, unknown>[]>(raw).map(mapCase)
}

export async function getPrecedents(disputeType: string, limit = 10): Promise<Case[]> {
  const raw = await callView('get_precedents', [disputeType, limit])
  return parseJsonResult<Record<string, unknown>[]>(raw).map(mapCase)
}

export async function getAllPrecedents(limit = 50): Promise<Case[]> {
  const raw = await callView('get_all_precedents', [limit])
  return parseJsonResult<Record<string, unknown>[]>(raw).map(mapCase)
}

export async function getTransparencyStats(): Promise<TransparencyStats> {
  const raw = await callView('get_transparency_stats', [])
  return parseJsonResult<TransparencyStats>(raw)
}

export async function getInstitutionProfile(address: string): Promise<InstitutionProfile> {
  const raw = await callView('get_institution_profile', [address])
  return mapInstitutionProfile(parseJsonResult<Record<string, unknown>>(raw))
}

export async function getAllInstitutions(): Promise<InstitutionProfile[]> {
  const raw = await callView('get_all_institutions', [])
  return parseJsonResult<Record<string, unknown>[]>(raw).map(mapInstitutionProfile)
}

export async function getInstitutionLeaderboard(): Promise<InstitutionProfile[]> {
  const raw = await callView('get_institution_leaderboard', [])
  return parseJsonResult<Record<string, unknown>[]>(raw).map(mapInstitutionProfile)
}

export async function verifyEvidenceHash(caseId: string, hash: string): Promise<boolean> {
  const raw = await callView('verify_evidence_hash', [caseId, hash])
  return raw as boolean
}

export async function getRole(address: string): Promise<string> {
  const raw = await callView('get_role', [address])
  return raw as string
}

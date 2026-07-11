# Campus Justice Protocol — Intelligent Contract Specification
# Phase 1 — Architecture Design

---

## Overview

Single production-grade GenLayer Intelligent Contract.
File: contracts/src/campus_justice_protocol.py

---

## Role System

Roles stored per address:
- STUDENT
- INSTITUTION
- ADMIN

---

## State Entities

### Case
```
case_id: str          # UUID generated on-chain
filer: address        # Student wallet
institution: address  # Institution wallet
dispute_type: str     # GPA | GRADE | TRANSCRIPT | SCHOLARSHIP | SUSPENSION | EXPULSION | FEE | HOSTEL | THESIS | OTHER
status: str           # SUBMITTED | VERIFIED | RESPONDED | DELIBERATING | JUDGMENT_ISSUED | APPEALED | FINAL_JUDGMENT | CLOSED
created_at: int       # Timestamp
evidence_hashes: list[str]   # SHA-256 hashes of student evidence
response_hashes: list[str]   # SHA-256 hashes of institution evidence
judgment: Judgment | None
appeal: Appeal | None
precedent_refs: list[str]    # References to similar resolved cases
```

### Evidence
```
hash: str             # SHA-256
uploader: address
timestamp: int
description: str
```

### Judgment
```
outcome: str          # UPHELD | REJECTED | FURTHER_REVIEW | SETTLEMENT_RECOMMENDED
reasoning: str        # Full AI reasoning text
evidence_summary: str
confidence_score: float  # 0.0 - 1.0
validator_consensus: dict
issued_at: int
```

### Appeal
```
appellant: address
grounds: str
filed_at: int
outcome: Judgment | None
```

### InstitutionProfile
```
address: address
name: str
domain: str
verified: bool
reputation_score: float
total_cases: int
resolved_cases: int
appeal_success_rate: float
avg_resolution_days: float
```

---

## Contract Methods

### Admin Methods
- register_institution(address, name, domain)
- verify_institution(address)
- set_role(address, role)

### Student Methods
- create_case(institution, dispute_type, description, evidence_hashes) → case_id
- add_evidence(case_id, hashes)
- file_appeal(case_id, grounds)

### Institution Methods
- submit_response(case_id, response_text, evidence_hashes)

### Contract Internal (GenLayer AI)
- evaluate_case(case_id) → Judgment   # Non-deterministic via LLM
- calculate_reputation(institution_address) → float

### View Methods
- get_case(case_id) → Case
- get_cases_by_student(address) → list[Case]
- get_cases_by_institution(address) → list[Case]
- get_precedents(dispute_type, limit) → list[Case]
- get_institution_profile(address) → InstitutionProfile
- get_transparency_stats() → dict

---

## AI Evaluation Logic (Non-Deterministic)

The evaluate_case method will:
1. Fetch academic regulations via web_search (GenLayer equivalence)
2. Analyze student complaint + evidence hashes
3. Analyze institution response + evidence hashes
4. Retrieve similar precedent cases from on-chain state
5. Apply reasoning chain:
   - Evidence quality assessment
   - Regulatory compliance check
   - Precedent alignment
   - Confidence calibration
6. Return structured Judgment with full reasoning

---

## Case State Machine

SUBMITTED → VERIFIED → INSTITUTION_NOTIFIED → RESPONDED → DELIBERATING → JUDGMENT_ISSUED → CLOSED
                                                                         ↘ APPEALED → DELIBERATING → FINAL_JUDGMENT → CLOSED

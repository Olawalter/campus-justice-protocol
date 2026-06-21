"""
Campus Justice Protocol — Contract Test Suite v2
Tests the rewritten GenLayer-compliant contract.

State is stored as JSON strings in TreeMap.
Sender is gl.message.sender_address (not sender_account).
Evidence hashes are passed as JSON strings.
"""

import pytest
import json
from unittest.mock import patch, MagicMock

# ── Test addresses ────────────────────────────────────────────────────────────

ADMIN       = "0xD9368922786222Ad59fA9C54769927C6DBddB109"
STUDENT_1   = "0xSTUDENT00000000000000000000000000000001"
STUDENT_2   = "0xSTUDENT00000000000000000000000000000002"
INST_1      = "0xINSTITUTION000000000000000000000000001"
INST_2      = "0xINSTITUTION000000000000000000000000002"
STRANGER    = "0xSTRANGER000000000000000000000000000001"

LONG_DESC   = "My GPA was incorrectly computed in semester two. " * 4  # > 50 chars

# ── Mock GenLayer runtime ─────────────────────────────────────────────────────

class MockMessage:
    def __init__(self, sender: str):
        self.sender_address = sender


class MockEqPrinciple:
    @staticmethod
    def strict_eq(fn):
        return fn()


class MockNondet:
    _response = ""

    @classmethod
    def exec_prompt(cls, prompt):
        return cls._response


class MockGL:
    message: MockMessage
    eq_principle = MockEqPrinciple()
    nondet = MockNondet()

    @staticmethod
    def public():
        pass


# ── Contract factory ──────────────────────────────────────────────────────────

def make_gl(sender: str) -> MockGL:
    gl = MockGL()
    gl.message = MockMessage(sender)
    return gl


def make_contract(caller: str = ADMIN):
    import sys, types

    # Build a minimal fake genlayer module
    gl_mod = types.ModuleType("genlayer")
    gl_inst = make_gl(caller)

    # TreeMap backed by dict
    class TreeMap(dict):
        pass

    # DynArray backed by list
    class DynArray(list):
        pass

    # u256 is just int
    class u256(int):
        pass

    def allow_storage(cls):
        return cls

    def dataclass(cls):
        return cls

    class _Public:
        @staticmethod
        def write(fn):
            return fn

        @staticmethod
        def view(fn):
            return fn

    class _GL:
        message = gl_inst.message
        eq_principle = MockEqPrinciple()
        nondet = MockNondet()
        public = _Public()

    gl_mod.gl = _GL()
    gl_mod.TreeMap = TreeMap
    gl_mod.DynArray = DynArray
    gl_mod.u256 = u256
    gl_mod.allow_storage = allow_storage
    gl_mod.dataclass = dataclass

    # star-import shim
    gl_mod.__all__ = ["gl", "TreeMap", "DynArray", "u256", "allow_storage", "dataclass"]

    sys.modules["genlayer"] = gl_mod

    # Now import the contract fresh each time
    import importlib
    if "contracts.src.campus_justice_protocol" in sys.modules:
        del sys.modules["contracts.src.campus_justice_protocol"]

    from contracts.src.campus_justice_protocol import CampusJusticeProtocol
    contract = CampusJusticeProtocol.__new__(CampusJusticeProtocol)
    # Init storage
    contract.roles       = TreeMap()
    contract.cases       = TreeMap()
    contract.institutions = TreeMap()
    contract.case_counter = u256(0)
    contract.precedents  = DynArray()
    contract.admin       = ""

    # Run constructor
    contract.__init__(admin_address=caller)
    contract._gl = _GL  # keep ref so we can swap sender

    return contract, _GL


def call(contract, gl_cls, sender: str, fn_name: str, *args):
    """Call a contract method under a given sender."""
    gl_cls.message = MockMessage(sender)
    return getattr(contract, fn_name)(*args)


# ── Helpers ───────────────────────────────────────────────────────────────────

def setup_institution(contract, gl, verified=True):
    call(contract, gl, ADMIN, "register_institution", INST_1, "Lagos University", "unilag.edu.ng")
    if verified:
        call(contract, gl, ADMIN, "verify_institution", INST_1)


def setup_student(contract, gl):
    call(contract, gl, ADMIN, "register_student", STUDENT_1)


def file_case(contract, gl, caller=STUDENT_1, desc=LONG_DESC, hashes=None):
    h = json.dumps(hashes or ["evhash1", "evhash2"])
    return call(contract, gl, caller, "create_case",
                INST_1, "GPA_MISCALCULATION", desc, h, "2020/12345", "Computer Science")


def advance_to_responded(contract, gl):
    """Set up a full case ready for AI evaluation."""
    setup_student(contract, gl)
    setup_institution(contract, gl)
    case_id = file_case(contract, gl)
    call(contract, gl, ADMIN, "verify_case", case_id)
    call(contract, gl, ADMIN, "notify_institution", case_id)
    call(contract, gl, INST_1, "submit_response", case_id,
         "The GPA was correctly computed per academic regulations section 4.2.", json.dumps(["resp1"]))
    return case_id


MOCK_JUDGMENT = json.dumps({
    "outcome": "UPHELD",
    "reasoning": "The student provided compelling documentary evidence that the GPA was miscalculated. The institution failed to address the specific computation error in semester 2. Based on academic regulations and evidence provided, the complaint is valid.",
    "evidence_summary": "Student submitted 2 documents including a transcript. Institution provided 1 policy document but no GPA calculation breakdown.",
    "confidence_score": 0.84,
    "key_factors": ["Documentary evidence", "Inadequate response", "Regulatory non-compliance"],
    "recommendations": "Recalculate GPA per section 4.2 within 14 days and update official transcript.",
})

MOCK_APPEAL = json.dumps({
    "outcome": "UPHELD",
    "reasoning": "The appeal grounds are substantive. The original judgment correctly identified the GPA error. The institution's appeal fails to provide new evidence of regulatory compliance. The original outcome is confirmed with higher confidence.",
    "evidence_summary": "All evidence reviewed including appeal submissions. Student position well-supported.",
    "appeal_assessment": "Appeal grounds are procedurally valid but fail to introduce new evidence. Original outcome stands.",
    "confidence_score": 0.91,
    "key_factors": ["No new institutional evidence", "Appeal grounds unsubstantiated", "Original judgment correct"],
    "recommendations": "Institution must implement GPA correction within 7 days of this final ruling.",
})


# ─────────────────────────────────────────────────────────────────────────────
# ROLE MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

class TestRoleManagement:

    def test_admin_set_on_init(self):
        c, gl = make_contract()
        assert c.roles[ADMIN] == "ADMIN"
        assert c.admin == ADMIN

    def test_register_student(self):
        c, gl = make_contract()
        call(c, gl, ADMIN, "register_student", STUDENT_1)
        assert c.roles[STUDENT_1] == "STUDENT"

    def test_register_institution_creates_profile(self):
        c, gl = make_contract()
        call(c, gl, ADMIN, "register_institution", INST_1, "Lagos University", "unilag.edu.ng")
        assert c.roles[INST_1] == "INSTITUTION"
        profile = json.loads(c.institutions[INST_1])
        assert profile["name"] == "Lagos University"
        assert profile["domain"] == "unilag.edu.ng"
        assert profile["verified"] is False

    def test_non_admin_cannot_register_student(self):
        c, gl = make_contract()
        call(c, gl, ADMIN, "register_student", STUDENT_1)
        with pytest.raises(Exception, match="ADMIN role required"):
            call(c, gl, STUDENT_1, "register_student", STUDENT_2)

    def test_set_admin_transfers_role(self):
        c, gl = make_contract()
        NEW_ADMIN = "0xNEWADMIN0000000000000000000000000000001"
        call(c, gl, ADMIN, "set_admin", NEW_ADMIN)
        assert c.roles[NEW_ADMIN] == "ADMIN"
        assert c.admin == NEW_ADMIN
        assert c.roles[ADMIN] == "STUDENT"

    def test_get_role_unregistered(self):
        c, gl = make_contract()
        result = call(c, gl, ADMIN, "get_role", STRANGER)
        assert result == "UNREGISTERED"

    def test_get_role_registered(self):
        c, gl = make_contract()
        call(c, gl, ADMIN, "register_student", STUDENT_1)
        result = call(c, gl, ADMIN, "get_role", STUDENT_1)
        assert result == "STUDENT"


# ─────────────────────────────────────────────────────────────────────────────
# INSTITUTION MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

class TestInstitutionManagement:

    def test_institution_starts_unverified(self):
        c, gl = make_contract()
        call(c, gl, ADMIN, "register_institution", INST_1, "Lagos University", "unilag.edu.ng")
        profile = json.loads(c.institutions[INST_1])
        assert profile["verified"] is False

    def test_admin_can_verify_institution(self):
        c, gl = make_contract()
        setup_institution(c, gl, verified=True)
        profile = json.loads(c.institutions[INST_1])
        assert profile["verified"] is True

    def test_is_institution_verified_true(self):
        c, gl = make_contract()
        setup_institution(c, gl, verified=True)
        assert call(c, gl, ADMIN, "is_institution_verified", INST_1) is True

    def test_is_institution_verified_false(self):
        c, gl = make_contract()
        setup_institution(c, gl, verified=False)
        assert call(c, gl, ADMIN, "is_institution_verified", INST_1) is False

    def test_get_institution_profile(self):
        c, gl = make_contract()
        setup_institution(c, gl)
        raw = call(c, gl, ADMIN, "get_institution_profile", INST_1)
        profile = json.loads(raw)
        assert profile["name"] == "Lagos University"
        assert profile["reputation_score"] == 0.0

    def test_cannot_verify_unregistered_institution(self):
        c, gl = make_contract()
        with pytest.raises(Exception):
            call(c, gl, ADMIN, "verify_institution", INST_1)

    def test_register_institution_missing_name_fails(self):
        c, gl = make_contract()
        with pytest.raises(Exception, match="required"):
            call(c, gl, ADMIN, "register_institution", INST_1, "", "unilag.edu.ng")

    def test_get_all_institutions(self):
        c, gl = make_contract()
        call(c, gl, ADMIN, "register_institution", INST_1, "Lagos University", "unilag.edu.ng")
        call(c, gl, ADMIN, "register_institution", INST_2, "ABU", "abu.edu.ng")
        raw = call(c, gl, ADMIN, "get_all_institutions")
        institutions = json.loads(raw)
        assert len(institutions) == 2


# ─────────────────────────────────────────────────────────────────────────────
# CASE FILING
# ─────────────────────────────────────────────────────────────────────────────

class TestCaseFiling:

    def test_student_can_file_case(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        assert case_id == "CJP-000001"
        assert case_id in c.cases

    def test_case_fields_correct(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        case = json.loads(c.cases[case_id])
        assert case["filer"] == STUDENT_1
        assert case["institution"] == INST_1
        assert case["dispute_type"] == "GPA_MISCALCULATION"
        assert case["status"] == "SUBMITTED"
        assert case["evidence_hashes"] == ["evhash1", "evhash2"]
        assert case["matric_number"] == "2020/12345"
        assert case["department"] == "Computer Science"
        assert case["judgment"] is None
        assert case["appeal"] is None

    def test_case_counter_increments(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        id1 = file_case(c, gl)
        id2 = file_case(c, gl)
        assert id1 == "CJP-000001"
        assert id2 == "CJP-000002"

    def test_institution_total_cases_increments(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        file_case(c, gl)
        file_case(c, gl)
        profile = json.loads(c.institutions[INST_1])
        assert profile["total_cases"] == 2

    def test_unregistered_cannot_file(self):
        c, gl = make_contract()
        setup_institution(c, gl)
        with pytest.raises(Exception, match="registered students"):
            file_case(c, gl, caller=STRANGER)

    def test_unverified_institution_rejected(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl, verified=False)
        with pytest.raises(Exception, match="not yet verified"):
            file_case(c, gl)

    def test_short_description_rejected(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        with pytest.raises(Exception, match="at least 50"):
            file_case(c, gl, desc="Too short.")

    def test_invalid_dispute_type_rejected(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        with pytest.raises(Exception, match="Invalid dispute type"):
            call(c, gl, STUDENT_1, "create_case",
                 INST_1, "INVALID_TYPE", LONG_DESC, json.dumps([]), "2020/12345", "CS")

    def test_too_many_evidence_files_rejected(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        hashes = [f"hash{i}" for i in range(11)]
        with pytest.raises(Exception, match="Maximum 10"):
            file_case(c, gl, hashes=hashes)


# ─────────────────────────────────────────────────────────────────────────────
# CASE LIFECYCLE TRANSITIONS
# ─────────────────────────────────────────────────────────────────────────────

class TestCaseLifecycle:

    def test_admin_verifies_case(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        call(c, gl, ADMIN, "verify_case", case_id)
        assert json.loads(c.cases[case_id])["status"] == "VERIFIED"

    def test_cannot_verify_twice(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        call(c, gl, ADMIN, "verify_case", case_id)
        with pytest.raises(Exception, match="SUBMITTED"):
            call(c, gl, ADMIN, "verify_case", case_id)

    def test_notify_institution(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        call(c, gl, ADMIN, "verify_case", case_id)
        call(c, gl, ADMIN, "notify_institution", case_id)
        assert json.loads(c.cases[case_id])["status"] == "INSTITUTION_NOTIFIED"

    def test_cannot_notify_before_verify(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        with pytest.raises(Exception, match="VERIFIED"):
            call(c, gl, ADMIN, "notify_institution", case_id)

    def test_institution_submits_response(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        case = json.loads(c.cases[case_id])
        assert case["status"] == "RESPONDED"
        assert case["response_hashes"] == ["resp1"]
        assert len(case["response_text"]) > 0

    def test_wrong_institution_cannot_respond(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        call(c, gl, ADMIN, "register_institution", INST_2, "ABU", "abu.edu.ng")
        call(c, gl, ADMIN, "verify_institution", INST_2)
        case_id = file_case(c, gl)
        call(c, gl, ADMIN, "verify_case", case_id)
        call(c, gl, ADMIN, "notify_institution", case_id)
        with pytest.raises(Exception, match="named institution"):
            call(c, gl, INST_2, "submit_response",
                 case_id, "Not our case response.", json.dumps([]))

    def test_short_response_rejected(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        call(c, gl, ADMIN, "verify_case", case_id)
        call(c, gl, ADMIN, "notify_institution", case_id)
        with pytest.raises(Exception, match="at least 30"):
            call(c, gl, INST_1, "submit_response", case_id, "Too short.", json.dumps([]))

    def test_add_evidence_before_response(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        call(c, gl, ADMIN, "verify_case", case_id)
        call(c, gl, STUDENT_1, "add_student_evidence", case_id, json.dumps(["new_hash1"]))
        case = json.loads(c.cases[case_id])
        assert "new_hash1" in case["evidence_hashes"]

    def test_cannot_add_evidence_after_response(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        with pytest.raises(Exception, match="before institution response"):
            call(c, gl, STUDENT_1, "add_student_evidence", case_id, json.dumps(["late_hash"]))


# ─────────────────────────────────────────────────────────────────────────────
# EVIDENCE VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

class TestEvidenceVerification:

    def test_verify_registered_hash(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        assert call(c, gl, ADMIN, "verify_evidence_hash", case_id, "evhash1") is True

    def test_reject_unregistered_hash(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        assert call(c, gl, ADMIN, "verify_evidence_hash", case_id, "FAKE_HASH") is False

    def test_verify_response_hash(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        assert call(c, gl, ADMIN, "verify_evidence_hash", case_id, "resp1") is True

    def test_verify_nonexistent_case(self):
        c, gl = make_contract()
        result = call(c, gl, ADMIN, "verify_evidence_hash", "CJP-999999", "somehash")
        assert result is False


# ─────────────────────────────────────────────────────────────────────────────
# AI EVALUATION
# ─────────────────────────────────────────────────────────────────────────────

class TestAIEvaluation:

    def test_evaluation_produces_judgment(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        MockNondet._response = MOCK_JUDGMENT
        call(c, gl, ADMIN, "evaluate_case", case_id)
        case = json.loads(c.cases[case_id])
        assert case["status"] == "JUDGMENT_ISSUED"
        assert case["judgment"]["outcome"] == "UPHELD"
        assert case["judgment"]["confidence_score"] == pytest.approx(0.84)

    def test_high_confidence_adds_to_precedents(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        MockNondet._response = MOCK_JUDGMENT
        call(c, gl, ADMIN, "evaluate_case", case_id)
        assert case_id in list(c.precedents)

    def test_reputation_updated_after_upheld(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        MockNondet._response = MOCK_JUDGMENT
        call(c, gl, ADMIN, "evaluate_case", case_id)
        profile = json.loads(c.institutions[INST_1])
        assert profile["upheld_against"] == 1

    def test_cannot_evaluate_non_responded_case(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        case_id = file_case(c, gl)
        call(c, gl, ADMIN, "verify_case", case_id)
        with pytest.raises(Exception, match="RESPONDED"):
            call(c, gl, ADMIN, "evaluate_case", case_id)

    def test_stranger_cannot_trigger_evaluation(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        MockNondet._response = MOCK_JUDGMENT
        with pytest.raises(Exception, match="case parties or admin"):
            call(c, gl, STRANGER, "evaluate_case", case_id)

    def test_low_confidence_not_added_to_precedents(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        low_conf = json.dumps({
            "outcome": "UPHELD",
            "reasoning": "Borderline case with insufficient evidence on both sides.",
            "evidence_summary": "Limited evidence from both parties.",
            "confidence_score": 0.55,
            "key_factors": ["Insufficient evidence"],
            "recommendations": "Both parties provide more documentation.",
        })
        MockNondet._response = low_conf
        call(c, gl, ADMIN, "evaluate_case", case_id)
        assert case_id not in list(c.precedents)


# ─────────────────────────────────────────────────────────────────────────────
# APPEALS
# ─────────────────────────────────────────────────────────────────────────────

class TestAppeals:

    def setup_judged(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        MockNondet._response = MOCK_JUDGMENT
        call(c, gl, ADMIN, "evaluate_case", case_id)
        return c, gl, case_id

    def test_institution_can_file_appeal(self):
        c, gl, case_id = self.setup_judged()
        grounds = "The AI misinterpreted regulation 4.2 which permits our calculation method in semester 2."
        call(c, gl, INST_1, "file_appeal", case_id, grounds)
        case = json.loads(c.cases[case_id])
        assert case["status"] == "APPEALED"
        assert case["appeal"]["appellant"] == INST_1

    def test_student_can_file_appeal(self):
        c, gl, case_id = self.setup_judged()
        # Flip to rejected so student can appeal
        raw = json.loads(c.cases[case_id])
        raw["judgment"]["outcome"] = "REJECTED"
        c.cases[case_id] = json.dumps(raw)
        grounds = "The institution did not address my specific evidence showing the computation error in semester 2."
        call(c, gl, STUDENT_1, "file_appeal", case_id, grounds)
        case = json.loads(c.cases[case_id])
        assert case["appeal"]["appellant"] == STUDENT_1

    def test_stranger_cannot_appeal(self):
        c, gl, case_id = self.setup_judged()
        with pytest.raises(Exception, match="case parties"):
            call(c, gl, STRANGER, "file_appeal", case_id, "I want to contest this case outcome.")

    def test_short_grounds_rejected(self):
        c, gl, case_id = self.setup_judged()
        with pytest.raises(Exception, match="at least 20"):
            call(c, gl, INST_1, "file_appeal", case_id, "Too short.")

    def test_grounds_too_long_rejected(self):
        c, gl, case_id = self.setup_judged()
        with pytest.raises(Exception, match="2000"):
            call(c, gl, INST_1, "file_appeal", case_id, "x" * 2001)

    def test_duplicate_appeal_rejected(self):
        c, gl, case_id = self.setup_judged()
        grounds = "The AI misinterpreted our regulation 4.2 which permits the calculation method used."
        call(c, gl, INST_1, "file_appeal", case_id, grounds)
        with pytest.raises(Exception, match="already been filed"):
            call(c, gl, INST_1, "file_appeal", case_id, grounds)

    def test_cannot_appeal_wrong_status(self):
        c, gl, case_id = self.setup_judged()
        # Manually set to RESPONDED (not JUDGMENT_ISSUED)
        raw = json.loads(c.cases[case_id])
        raw["status"] = "RESPONDED"
        c.cases[case_id] = json.dumps(raw)
        with pytest.raises(Exception, match="JUDGMENT_ISSUED"):
            call(c, gl, INST_1, "file_appeal", case_id, "We want to appeal the decision made.")

    def test_appeal_evaluation_produces_final_judgment(self):
        c, gl, case_id = self.setup_judged()
        grounds = "The AI misinterpreted regulation 4.2 which permits the GPA calculation method in semester 2."
        call(c, gl, INST_1, "file_appeal", case_id, grounds)
        MockNondet._response = MOCK_APPEAL
        call(c, gl, ADMIN, "evaluate_appeal", case_id)
        case = json.loads(c.cases[case_id])
        assert case["status"] == "FINAL_JUDGMENT"
        assert case["appeal_judgment"]["outcome"] == "UPHELD"
        assert case["appeal_judgment"]["confidence_score"] == pytest.approx(0.91)
        assert "appeal_assessment" in case["appeal_judgment"]

    def test_high_confidence_appeal_adds_to_precedents(self):
        c, gl, case_id = self.setup_judged()
        grounds = "The AI misinterpreted regulation 4.2 which permits the GPA calculation method in semester 2."
        call(c, gl, INST_1, "file_appeal", case_id, grounds)
        MockNondet._response = MOCK_APPEAL
        # Remove from precedents first (was added by evaluate_case)
        if case_id in list(c.precedents):
            c.precedents.remove(case_id)
        call(c, gl, ADMIN, "evaluate_appeal", case_id)
        assert case_id in list(c.precedents)


# ─────────────────────────────────────────────────────────────────────────────
# REPUTATION
# ─────────────────────────────────────────────────────────────────────────────

class TestReputation:

    def test_reputation_penalised_on_upheld(self):
        c, gl = make_contract()
        setup_institution(c, gl)
        # Set up 10 resolved cases
        p = json.loads(c.institutions[INST_1])
        p["total_cases"] = 10
        p["resolved_cases"] = 10
        p["upheld_against"] = 0
        c.institutions[INST_1] = json.dumps(p)
        c._update_reputation(INST_1, "UPHELD")
        profile = json.loads(c.institutions[INST_1])
        # upheld_against now 1; base=10/10=1.0; penalty=1/10*0.4=0.04; score=0.96
        assert profile["reputation_score"] == pytest.approx(0.96, abs=0.01)
        assert profile["upheld_against"] == 1

    def test_reputation_stable_on_rejected(self):
        c, gl = make_contract()
        setup_institution(c, gl)
        p = json.loads(c.institutions[INST_1])
        p["total_cases"] = 10
        p["resolved_cases"] = 10
        p["upheld_against"] = 0
        c.institutions[INST_1] = json.dumps(p)
        c._update_reputation(INST_1, "REJECTED")
        profile = json.loads(c.institutions[INST_1])
        # upheld_against still 0; score = 1.0 - 0 = 1.0
        assert profile["reputation_score"] == pytest.approx(1.0, abs=0.01)

    def test_reputation_clamped_at_zero(self):
        c, gl = make_contract()
        setup_institution(c, gl)
        p = json.loads(c.institutions[INST_1])
        p["total_cases"] = 5
        p["resolved_cases"] = 1
        p["upheld_against"] = 5
        c.institutions[INST_1] = json.dumps(p)
        c._update_reputation(INST_1, "UPHELD")
        profile = json.loads(c.institutions[INST_1])
        assert profile["reputation_score"] >= 0.0


# ─────────────────────────────────────────────────────────────────────────────
# TRANSPARENCY STATS & VIEWS
# ─────────────────────────────────────────────────────────────────────────────

class TestTransparencyAndViews:

    def test_empty_stats(self):
        c, gl = make_contract()
        raw = call(c, gl, ADMIN, "get_transparency_stats")
        stats = json.loads(raw)
        assert stats["total_cases"] == 0
        assert stats["institution_count"] == 0
        assert stats["precedent_count"] == 0

    def test_stats_after_case_filed(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        file_case(c, gl)
        raw = call(c, gl, ADMIN, "get_transparency_stats")
        stats = json.loads(raw)
        assert stats["total_cases"] == 1
        assert stats["pending_cases"] == 1
        assert stats["institution_count"] == 1
        assert stats["verified_institutions"] == 1

    def test_stats_resolved_increments(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        MockNondet._response = MOCK_JUDGMENT
        call(c, gl, ADMIN, "evaluate_case", case_id)
        raw = call(c, gl, ADMIN, "get_transparency_stats")
        stats = json.loads(raw)
        assert stats["resolved_cases"] == 1
        assert stats["upheld_rate"] == pytest.approx(1.0)

    def test_get_cases_by_student(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        file_case(c, gl)
        raw = call(c, gl, ADMIN, "get_cases_by_student", STUDENT_1)
        cases = json.loads(raw)
        assert len(cases) == 1
        assert cases[0]["filer"] == STUDENT_1

    def test_get_cases_by_institution(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        file_case(c, gl)
        raw = call(c, gl, ADMIN, "get_cases_by_institution", INST_1)
        cases = json.loads(raw)
        assert len(cases) == 1
        assert cases[0]["institution"] == INST_1

    def test_get_cases_by_status(self):
        c, gl = make_contract()
        setup_student(c, gl)
        setup_institution(c, gl)
        file_case(c, gl)
        raw = call(c, gl, ADMIN, "get_cases_by_status", "SUBMITTED")
        cases = json.loads(raw)
        assert len(cases) == 1

    def test_leaderboard_sorted_by_reputation(self):
        c, gl = make_contract()
        call(c, gl, ADMIN, "register_institution", INST_1, "Lagos University", "unilag.edu.ng")
        call(c, gl, ADMIN, "register_institution", INST_2, "ABU", "abu.edu.ng")
        p1 = json.loads(c.institutions[INST_1])
        p2 = json.loads(c.institutions[INST_2])
        p1["reputation_score"] = 0.75
        p2["reputation_score"] = 0.90
        c.institutions[INST_1] = json.dumps(p1)
        c.institutions[INST_2] = json.dumps(p2)
        raw = call(c, gl, ADMIN, "get_institution_leaderboard")
        board = json.loads(raw)
        assert board[0]["address"] == INST_2
        assert board[1]["address"] == INST_1

    def test_get_precedents_filtered_by_type(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        MockNondet._response = MOCK_JUDGMENT
        call(c, gl, ADMIN, "evaluate_case", case_id)
        raw = call(c, gl, ADMIN, "get_precedents", "GPA_MISCALCULATION", 10)
        precs = json.loads(raw)
        assert len(precs) == 1
        assert precs[0]["dispute_type"] == "GPA_MISCALCULATION"

    def test_get_case_judgment_returns_appeal_judgment_first(self):
        c, gl = make_contract()
        case_id = advance_to_responded(c, gl)
        MockNondet._response = MOCK_JUDGMENT
        call(c, gl, ADMIN, "evaluate_case", case_id)
        grounds = "The AI misinterpreted regulation 4.2 which permits the calculation method used."
        call(c, gl, INST_1, "file_appeal", case_id, grounds)
        MockNondet._response = MOCK_APPEAL
        call(c, gl, ADMIN, "evaluate_appeal", case_id)
        raw = call(c, gl, ADMIN, "get_case_judgment", case_id)
        j = json.loads(raw)
        assert "appeal_assessment" in j  # appeal judgment has this field


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

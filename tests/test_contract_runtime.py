import importlib.util
import json
import sys
import types
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "contracts" / "ClausePilot.py"
OWNER = "0x" + "1" * 40
COUNTERPARTY = "0x" + "2" * 40
OUTSIDER = "0x" + "3" * 40
EVIDENCE_URL = "https://status.example.com/service"
SOURCES = json.dumps([
    {"origin": "https://status.example.com", "url": EVIDENCE_URL, "marker": "ClausePilot Demo API"},
    {"origin": "https://audit.example.com", "url": "https://audit.example.com/service", "marker": "ClausePilot Demo API"},
])


class UserError(Exception):
    pass


class Decorator:
    def __call__(self, value):
        return value


class TreeMap(dict):
    @classmethod
    def __class_getitem__(cls, _item):
        return cls


class Sender:
    as_hex = OWNER


class Message:
    sender_address = Sender()


class Response:
    body = "ClausePilot Demo API is operational throughout the sealed observation window."


class FakeWeb:
    calls = 0

    @classmethod
    def get(cls, _url):
        cls.calls += 1
        return Response()


class FakeNondet:
    web = FakeWeb

    @staticmethod
    def exec_prompt(_prompt, response_format=None):
        assert response_format == "json"
        if "reviewing a bounded counterparty challenge" in _prompt:
            return {
                "decision": "UPHOLD", "final_state": "SATISFIED",
                "rationale": "The counter-evidence does not rebut the corroborated finding.",
            }
        return {
            "scope_relation": "MATCH",
            "coverage": "SUFFICIENT",
            "semantic_state": "SATISFIED",
            "material_facts": ["The bound service is reported operational"],
            "rationale": "The evidence supports the bounded uptime obligation.",
        }


class FakeEqPrinciple:
    @staticmethod
    def prompt_comparative(evaluate, _principle):
        return evaluate()


fake_gl = types.SimpleNamespace(
    Contract=object,
    public=types.SimpleNamespace(write=Decorator(), view=Decorator()),
    vm=types.SimpleNamespace(UserError=UserError),
    message=Message(),
    nondet=FakeNondet,
    eq_principle=FakeEqPrinciple,
)
fake_module = types.ModuleType("genlayer")
fake_module.gl = fake_gl
fake_module.bigint = int
fake_module.TreeMap = TreeMap
fake_module.Address = lambda value: value
fake_module.allow_storage = Decorator()
sys.modules["genlayer"] = fake_module

spec = importlib.util.spec_from_file_location("clausepilot_contract_runtime", CONTRACT_PATH)
contract_module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(contract_module)


def new_contract():
    contract = contract_module.ClausePilot()
    contract.agreements = TreeMap()
    contract.obligations = TreeMap()
    contract.checkpoints = TreeMap()
    contract.obligation_keys = TreeMap()
    contract.checkpoint_keys = TreeMap()
    now = [1_000_000]
    contract._now = lambda: now[0]
    fake_gl.message.sender_address.as_hex = OWNER
    FakeWeb.calls = 0
    agreement_id = contract.register_agreement(
        COUNTERPARTY, "Cloud Services Agreement", "v1", "a" * 64
    )
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.accept_agreement(agreement_id)
    fake_gl.message.sender_address.as_hex = OWNER
    obligation_id = contract.add_obligation(
        agreement_id, "uptime-core", "UPTIME", "Commercial uptime",
        "Maintain commercially reasonable availability during the sealed observation window.",
        SOURCES, 2, "https://counter.example.com", 300, 3600, 300,
    )
    return contract, now, agreement_id, obligation_id


def test_counterparty_acceptance_binds_all_obligation_terms():
    contract, _now, _agreement_id, obligation_id = new_contract()
    before = json.loads(contract.get_obligation(obligation_id))
    assert before["accepted"] is False
    assert before["obligation_key"] == "uptime-core"
    assert len(before["terms_digest"]) == 64

    fake_gl.message.sender_address.as_hex = OUTSIDER
    with pytest.raises(UserError, match="COUNTERPARTY_ONLY"):
        contract.accept_obligation(obligation_id, before["terms_digest"])

    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    with pytest.raises(UserError, match="TERMS_DIGEST_MISMATCH"):
        contract.accept_obligation(obligation_id, "f" * 64)
    contract.accept_obligation(obligation_id, before["terms_digest"])
    after = json.loads(contract.get_obligation(obligation_id))
    assert after["accepted"] is True
    assert after["accepted_at"] == 1_000_000
    assert after["terms_digest"] == before["terms_digest"]
    with pytest.raises(UserError, match="OBLIGATION_NOT_ACCEPTABLE"):
        contract.accept_obligation(obligation_id, before["terms_digest"])


def test_unaccepted_obligation_cannot_open_checkpoint():
    contract, _now, _agreement_id, obligation_id = new_contract()
    fake_gl.message.sender_address.as_hex = OWNER
    with pytest.raises(UserError, match="OBLIGATION_NOT_ACCEPTED"):
        contract.open_due_checkpoint(obligation_id)
    assert contract.next_checkpoint_id == 0


def test_one_checkpoint_in_flight_prevents_stale_overwrite():
    contract, now, _agreement_id, obligation_id = new_contract()
    obligation = json.loads(contract.get_obligation(obligation_id))
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.accept_obligation(obligation_id, obligation["terms_digest"])
    fake_gl.message.sender_address.as_hex = OWNER
    checkpoint_id = contract.open_due_checkpoint(obligation_id)
    now[0] += 3600
    with pytest.raises(UserError, match="CHECKPOINT_IN_FLIGHT"):
        contract.open_due_checkpoint(obligation_id)
    assert json.loads(contract.get_obligation(obligation_id))["open_checkpoint_id"] == checkpoint_id


def test_late_open_records_missed_window_without_fetch_or_retrospective_ai():
    contract, now, _agreement_id, obligation_id = new_contract()
    obligation = json.loads(contract.get_obligation(obligation_id))
    scheduled_due = obligation["next_due_at"]
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.accept_obligation(obligation_id, obligation["terms_digest"])
    now[0] = scheduled_due + 7200
    fake_gl.message.sender_address.as_hex = OWNER
    checkpoint_id = contract.open_due_checkpoint(obligation_id)
    checkpoint = json.loads(contract.get_checkpoint(checkpoint_id))
    after = json.loads(contract.get_obligation(obligation_id))
    assert checkpoint["window_start"] == scheduled_due
    assert checkpoint["window_end"] == scheduled_due + obligation["window_seconds"]
    assert checkpoint["status"] == "FINALIZED"
    assert checkpoint["final_state"] == "UNRESOLVED"
    assert checkpoint["challenge_decision"] == "MISSED_SCHEDULE"
    assert FakeWeb.calls == 0
    assert after["next_due_at"] == scheduled_due + obligation["cadence_seconds"]
    assert after["open_checkpoint_id"] == ""
    assert after["latest_checkpoint_id"] == checkpoint_id


def test_assessment_is_blocked_until_window_end_before_fetch_or_ai():
    contract, now, _agreement_id, obligation_id = new_contract()
    obligation = json.loads(contract.get_obligation(obligation_id))
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.accept_obligation(obligation_id, obligation["terms_digest"])
    fake_gl.message.sender_address.as_hex = OWNER
    checkpoint_id = contract.open_due_checkpoint(obligation_id)
    checkpoint = json.loads(contract.get_checkpoint(checkpoint_id))
    assert checkpoint["window_start"] == 1_000_000
    assert checkpoint["window_end"] == 1_000_300

    now[0] = 1_000_299
    with pytest.raises(UserError, match="OBSERVATION_WINDOW_OPEN"):
        contract.assess_checkpoint(checkpoint_id)
    assert FakeWeb.calls == 0
    assert json.loads(contract.get_checkpoint(checkpoint_id))["status"] == "OPEN"

    now[0] = 1_000_300
    assert contract.assess_checkpoint(checkpoint_id) == "SATISFIED"
    assert FakeWeb.calls == 2
    assessed = json.loads(contract.get_checkpoint(checkpoint_id))
    assert assessed["status"] == "PROVISIONAL"
    assert assessed["provisional_state"] == "SATISFIED"
    assert assessed["final_state"] == "UNRESOLVED"
    assert assessed["observed_at"] == 1_000_300
    assert json.loads(contract.get_obligation(obligation_id))["standing"] == "UNRESOLVED"

    with pytest.raises(UserError, match="CHALLENGE_WINDOW_OPEN"):
        contract.finalize_checkpoint(checkpoint_id)
    now[0] = 1_000_601
    assert contract.finalize_checkpoint(checkpoint_id) == "SATISFIED"
    final = json.loads(contract.get_checkpoint(checkpoint_id))
    assert final["status"] == "FINALIZED"
    assert final["challenge_decision"] == "UNCHALLENGED"
    assert json.loads(contract.get_obligation(obligation_id))["standing"] == "SATISFIED"
    assert json.loads(contract.get_obligation(obligation_id))["open_checkpoint_id"] == ""
    with pytest.raises(UserError, match="CHECKPOINT_NOT_FINALIZABLE"):
        contract.finalize_checkpoint(checkpoint_id)


def test_terms_digest_changes_if_any_consequential_policy_field_changes():
    args = [
        "0", OWNER, COUNTERPARTY, "v1", "a" * 64, "uptime-core", "UPTIME", "Commercial uptime",
        "Maintain commercially reasonable availability during the sealed observation window.",
        contract_module._canonical_sources(contract_module._source_policy(SOURCES)), 2,
        "https://counter.example.com", 300, 3600, 300,
    ]
    baseline = contract_module._obligation_terms_digest(*args)
    for index in range(len(args)):
        changed = list(args)
        changed[index] = changed[index] + 1 if isinstance(changed[index], int) else changed[index] + "-changed"
        assert contract_module._obligation_terms_digest(*changed) != baseline


def test_source_policy_is_bounded_unique_and_canonical():
    parsed = contract_module._source_policy(SOURCES)
    assert len(parsed) == 2
    assert json.loads(contract_module._canonical_sources(parsed)) == parsed
    assert contract_module._source_policy("[]") == []
    duplicate = json.dumps([json.loads(SOURCES)[0], json.loads(SOURCES)[0]])
    assert contract_module._source_policy(duplicate) == []
    same_origin = json.dumps([
        {"origin": "https://status.example.com", "url": "https://status.example.com/one", "marker": "Service"},
        {"origin": "https://status.example.com", "url": "https://status.example.com/two", "marker": "Service"},
    ])
    assert contract_module._source_policy(same_origin) == []


@pytest.mark.parametrize("states,threshold,expected", [
    (["SATISFIED", "SATISFIED"], 2, "SATISFIED"),
    (["BREACHED", "BREACHED", "UNRESOLVED"], 2, "BREACHED"),
    (["SATISFIED", "BREACHED"], 2, "UNRESOLVED"),
    (["SATISFIED"], 2, "UNRESOLVED"),
])
def test_provisional_state_requires_threshold_and_consistency(states, threshold, expected):
    results = [{"result": {"scope_relation": "MATCH", "coverage": "SUFFICIENT", "semantic_state": state}} for state in states]
    assert contract_module._derive_provisional(results, threshold) == expected


def _provisional_contract():
    contract, now, _agreement_id, obligation_id = new_contract()
    obligation = json.loads(contract.get_obligation(obligation_id))
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.accept_obligation(obligation_id, obligation["terms_digest"])
    fake_gl.message.sender_address.as_hex = OWNER
    checkpoint_id = contract.open_due_checkpoint(obligation_id)
    now[0] = 1_000_300
    contract.assess_checkpoint(checkpoint_id)
    return contract, now, obligation_id, checkpoint_id


def test_only_counterparty_can_submit_one_bounded_challenge():
    contract, _now, _obligation_id, checkpoint_id = _provisional_contract()
    fake_gl.message.sender_address.as_hex = OUTSIDER
    with pytest.raises(UserError, match="COUNTERPARTY_ONLY"):
        contract.submit_challenge(checkpoint_id, "https://counter.example.com/report", "ClausePilot", "a" * 64)
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    with pytest.raises(UserError, match="INVALID_CHALLENGE_EVIDENCE"):
        contract.submit_challenge(checkpoint_id, "https://evil.example.com/report", "ClausePilot", "a" * 64)
    contract.submit_challenge(checkpoint_id, "https://counter.example.com/report", "ClausePilot", "a" * 64)
    assert json.loads(contract.get_checkpoint(checkpoint_id))["status"] == "CHALLENGED"
    with pytest.raises(UserError, match="CHALLENGE_NOT_OPEN"):
        contract.submit_challenge(checkpoint_id, "https://counter.example.com/other", "ClausePilot", "b" * 64)


def test_late_challenge_is_rejected_without_mutation():
    contract, now, _obligation_id, checkpoint_id = _provisional_contract()
    before = contract.get_checkpoint(checkpoint_id)
    now[0] = 1_000_601
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    with pytest.raises(UserError, match="CHALLENGE_NOT_OPEN"):
        contract.submit_challenge(checkpoint_id, "https://counter.example.com/report", "ClausePilot", "a" * 64)
    assert contract.get_checkpoint(checkpoint_id) == before


def test_challenge_adjudication_and_finalization_are_separate_and_replay_safe():
    contract, _now, obligation_id, checkpoint_id = _provisional_contract()
    digest = contract_module.hashlib.sha256(Response.body.encode("utf-8")).hexdigest()
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.submit_challenge(checkpoint_id, "https://counter.example.com/report", "ClausePilot", digest)
    assert contract.adjudicate_challenge(checkpoint_id) == "SATISFIED"
    resolved = json.loads(contract.get_checkpoint(checkpoint_id))
    assert resolved["status"] == "RESOLVED"
    assert resolved["challenge_decision"] == "UPHOLD"
    assert resolved["challenge_snapshot_sha256"] == digest
    assert json.loads(contract.get_obligation(obligation_id))["standing"] == "UNRESOLVED"
    assert contract.finalize_checkpoint(checkpoint_id) == "SATISFIED"
    assert json.loads(contract.get_obligation(obligation_id))["standing"] == "SATISFIED"
    with pytest.raises(UserError, match="CHALLENGE_NOT_PENDING"):
        contract.adjudicate_challenge(checkpoint_id)


def test_challenge_digest_mismatch_fails_closed():
    contract, _now, obligation_id, checkpoint_id = _provisional_contract()
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.submit_challenge(checkpoint_id, "https://counter.example.com/report", "ClausePilot", "a" * 64)
    assert contract.adjudicate_challenge(checkpoint_id) == "UNRESOLVED"
    resolved = json.loads(contract.get_checkpoint(checkpoint_id))
    assert resolved["status"] == "RESOLVED"
    assert resolved["challenge_decision"] == "UNRESOLVED"
    assert contract.finalize_checkpoint(checkpoint_id) == "UNRESOLVED"
    assert json.loads(contract.get_obligation(obligation_id))["standing"] == "UNRESOLVED"


@pytest.mark.parametrize("bad_sources", [
    "not-json",
    "[]",
    json.dumps([{"origin": "http://status.example.com", "url": EVIDENCE_URL, "marker": "Service"}] * 2),
    json.dumps([{"origin": "https://status.example.com", "url": "https://evil.example.com/a", "marker": "Service"}] * 2),
    json.dumps([{"origin": "https://status.example.com", "url": EVIDENCE_URL, "marker": "x"}] * 2),
])
def test_invalid_source_policies_are_rejected(bad_sources):
    contract, _now, agreement_id, _obligation_id = new_contract()
    fake_gl.message.sender_address.as_hex = OWNER
    with pytest.raises(UserError, match="INVALID_SOURCE_POLICY"):
        contract.add_obligation(
            agreement_id, "other-key", "UPTIME", "Other uptime",
            "Maintain availability for the separately bounded monitored service.",
            bad_sources, 2, "https://counter.example.com", 300, 3600, 300,
        )


@pytest.mark.parametrize("threshold", [0, 1, 3, 99])
def test_invalid_corroboration_thresholds_are_rejected(threshold):
    contract, _now, agreement_id, _obligation_id = new_contract()
    fake_gl.message.sender_address.as_hex = OWNER
    with pytest.raises(UserError, match="INVALID_SOURCE_POLICY"):
        contract.add_obligation(
            agreement_id, "threshold-key", "UPTIME", "Threshold uptime",
            "Maintain availability for the separately bounded monitored service.",
            SOURCES, threshold, "https://counter.example.com", 300, 3600, 300,
        )


@pytest.mark.parametrize("origin,seconds", [
    ("http://counter.example.com", 300),
    ("https://counter.example.com/path", 300),
    ("https://counter.example.com", 299),
    ("https://counter.example.com", 604801),
    ("https://status.example.com", 300),
])
def test_invalid_challenge_policy_is_rejected(origin, seconds):
    contract, _now, agreement_id, _obligation_id = new_contract()
    fake_gl.message.sender_address.as_hex = OWNER
    with pytest.raises(UserError, match="INVALID_CHALLENGE_POLICY"):
        contract.add_obligation(
            agreement_id, "challenge-key", "UPTIME", "Challenge uptime",
            "Maintain availability for the separately bounded monitored service.",
            SOURCES, 2, origin, seconds, 3600, 300,
        )


def test_closed_obligation_cannot_finalize_provisional_checkpoint():
    contract, now, _obligation_id, checkpoint_id = _provisional_contract()
    fake_gl.message.sender_address.as_hex = OWNER
    contract.close_obligation(_obligation_id)
    now[0] = 1_000_601
    with pytest.raises(UserError, match="STALE_CHECKPOINT"):
        contract.finalize_checkpoint(checkpoint_id)
    assert json.loads(contract.get_checkpoint(checkpoint_id))["status"] == "PROVISIONAL"

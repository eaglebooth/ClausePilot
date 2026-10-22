import hashlib
import json

import pytest

from test_contract_runtime import FakeEqPrinciple, FakeNondet, Response, COUNTERPARTY, fake_gl
from test_v4_lifecycle import accepted


@pytest.mark.parametrize("state", ["SATISFIED", "AT_RISK", "BREACHED", "UNRESOLVED"])
def test_independent_semantically_equal_outputs_ignore_prose_and_fact_wording(monkeypatch, state):
    contract, now, _, oid = accepted()
    cid = contract.open_due_checkpoint(oid)
    now[0] += 300
    calls = [0]
    comparisons = []

    def prompt(_prompt, response_format=None):
        calls[0] += 1
        return {"scope_relation": "MATCH", "coverage": "SUFFICIENT",
            "semantic_state": state, "material_facts": [f"Independently worded material observation {calls[0]}"],
            "rationale": f"Independent explanation number {calls[0]} for the same classification."}

    def compare(evaluate):
        leader, validator = evaluate(), evaluate()
        comparisons.append((leader, validator))
        assert leader == validator
        assert "Independently worded" not in leader
        assert "Independent explanation" not in leader
        return leader

    monkeypatch.setattr(FakeNondet, "exec_prompt", staticmethod(prompt))
    monkeypatch.setattr(FakeEqPrinciple, "strict_eq", staticmethod(compare))
    assert contract.assess_checkpoint(cid) == state
    assert len(comparisons) == 1
    assert calls[0] == 4  # two separately fetched sources for leader and validator


def test_breach_still_requires_material_facts_before_canonicalization(monkeypatch):
    contract, now, _, oid = accepted()
    cid = contract.open_due_checkpoint(oid)
    now[0] += 300
    monkeypatch.setattr(FakeNondet, "exec_prompt", staticmethod(lambda *_a, **_kw: {
        "scope_relation":"MATCH", "coverage":"SUFFICIENT", "semantic_state":"BREACHED",
        "material_facts":[], "rationale":"An unsupported breach proposal with no facts.",
    }))
    assert contract.assess_checkpoint(cid) == "UNRESOLVED"
    cp = json.loads(contract.get_checkpoint(cid))
    assert not cp["source_results"]["qualified"]
    assert len(cp["source_results"]["errors"]) == 2


def test_challenge_comparison_excludes_independent_rationale_wording(monkeypatch):
    contract, now, _, oid = accepted()
    cid = contract.open_due_checkpoint(oid)
    now[0] += 300
    contract.assess_checkpoint(cid)
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.submit_challenge(cid,"https://counter.example.com/report","ClausePilot Demo API",hashlib.sha256(Response.body.encode()).hexdigest())
    count = [0]

    def prompt(_prompt, response_format=None):
        count[0] += 1
        return {"decision":"UPHOLD","final_state":"SATISFIED", "rationale":f"Different independent explanation {count[0]} for the same evidence."}

    def compare(evaluate):
        a,b=evaluate(),evaluate()
        assert a == b
        assert "Different independent" not in a
        return a

    monkeypatch.setattr(FakeNondet,"exec_prompt",staticmethod(prompt))
    monkeypatch.setattr(FakeEqPrinciple,"strict_eq",staticmethod(compare))
    assert contract.adjudicate_challenge(cid) == "SATISFIED"
    assert count[0] == 2

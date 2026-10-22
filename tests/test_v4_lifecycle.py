import json

import pytest

from test_contract_runtime import (
    new_contract, fake_gl, OWNER, COUNTERPARTY, OUTSIDER, SOURCES,
    UserError, FakeWeb, contract_module,
)


def accepted():
    contract, now, aid, oid = new_contract()
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.accept_obligation(oid, json.loads(contract.get_obligation(oid))["terms_digest"])
    return contract, now, aid, oid


def propose(contract, oid, key="revision-one"):
    fake_gl.message.sender_address.as_hex = OWNER
    return contract.propose_revision(
        oid, key, "UPTIME", "Revised uptime policy",
        "Maintain service availability under the newly agreed monitoring policy.",
        SOURCES, 2, "https://counter.example.com", 300, 3600, 300,
    )


def accept(contract, candidate):
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    contract.accept_revision(candidate, json.loads(contract.get_obligation(candidate))["terms_digest"])


def test_assessment_timeout_is_permissionless_terminal_and_no_ai():
    c, now, _, oid = accepted()
    cid = c.open_due_checkpoint(oid)
    deadline = json.loads(c.get_recovery_state(cid))["deadline"]
    now[0] = deadline
    with pytest.raises(UserError, match="RECOVERY_NOT_DUE"):
        c.expire_checkpoint(cid)
    now[0] += 1
    with pytest.raises(UserError, match="ASSESSMENT_DEADLINE_PASSED"):
        c.assess_checkpoint(cid)
    fake_gl.message.sender_address.as_hex = OUTSIDER
    assert c.expire_checkpoint(cid) == "UNRESOLVED"
    assert FakeWeb.calls == 0
    assert json.loads(c.get_obligation(oid))["open_checkpoint_id"] == ""
    assert json.loads(c.get_checkpoint(cid))["challenge_decision"] == "ASSESSMENT_TIMEOUT"
    with pytest.raises(UserError):
        c.expire_checkpoint(cid)
    # A subsequent scheduled window remains independently monitorable.
    # Recover without rewinding time: the elapsed scheduled window is explicitly
    # recorded as missed, then the next scheduled window can open normally.
    missed = c.open_due_checkpoint(oid)
    assert json.loads(c.get_checkpoint(missed))["challenge_decision"] == "MISSED_SCHEDULE"
    now[0] = json.loads(c.get_obligation(oid))["next_due_at"]
    fresh = c.open_due_checkpoint(oid)
    assert json.loads(c.get_checkpoint(fresh))["status"] == "OPEN"


def test_at_assessment_deadline_assessment_is_still_allowed():
    c, now, _, oid = accepted()
    cid = c.open_due_checkpoint(oid)
    now[0] = json.loads(c.get_recovery_state(cid))["deadline"]
    assert c.assess_checkpoint(cid) == "SATISFIED"
    with pytest.raises(UserError, match="CHECKPOINT_NOT_EXPIRABLE"):
        c.expire_checkpoint(cid)


def test_challenge_timeout_cannot_inherit_provisional_success():
    import hashlib
    from test_contract_runtime import Response
    c, now, _, oid = accepted()
    cid = c.open_due_checkpoint(oid)
    now[0] += 300
    c.assess_checkpoint(cid)
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    c.submit_challenge(cid, "https://counter.example.com/report", "ClausePilot Demo API", hashlib.sha256(Response.body.encode()).hexdigest())
    deadline = json.loads(c.get_recovery_state(cid))["deadline"]
    now[0] = deadline
    with pytest.raises(UserError, match="RECOVERY_NOT_DUE"):
        c.expire_checkpoint(cid)
    now[0] += 1
    calls = FakeWeb.calls
    with pytest.raises(UserError, match="ADJUDICATION_DEADLINE_PASSED"):
        c.adjudicate_challenge(cid)
    assert FakeWeb.calls == calls
    assert c.expire_checkpoint(cid) == "UNRESOLVED"
    assert json.loads(c.get_checkpoint(cid))["challenge_decision"] == "ADJUDICATION_TIMEOUT"


def test_revision_requires_counterparty_exact_digest_and_links_history():
    c, now, _, oid = accepted()
    before = c.get_obligation(oid)
    candidate = propose(c, oid)
    digest = json.loads(c.get_obligation(candidate))["terms_digest"]
    with pytest.raises(UserError, match="USE_ACCEPT_REVISION"):
        c.accept_obligation(candidate, digest)
    for sender in (OWNER, OUTSIDER):
        fake_gl.message.sender_address.as_hex = sender
        with pytest.raises(UserError, match="COUNTERPARTY_ONLY"):
            c.accept_revision(candidate, digest)
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    with pytest.raises(UserError, match="TERMS_DIGEST_MISMATCH"):
        c.accept_revision(candidate, "0" * 64)
    now[0] += 500
    accept(c, candidate)
    old = json.loads(c.get_obligation(oid))
    assert old["sources"] == json.loads(before)["sources"]
    assert old["terms_digest"] == json.loads(before)["terms_digest"]
    assert not old["active"]
    assert json.loads(c.get_policy_lifecycle(oid))["successor_id"] == candidate
    assert json.loads(c.get_obligation(candidate))["next_due_at"] == now[0]
    assert json.loads(c.get_obligation(candidate))["standing"] == "UNRESOLVED"
    assert json.loads(c.get_policy_lifecycle(candidate))["revision"] == 1
    assert not json.loads(c.get_policy_lifecycle(candidate))["stale"]
    with pytest.raises(UserError, match="REVISION_NOT_PENDING"):
        accept(c, candidate)
    with pytest.raises(UserError, match="OBLIGATION_INACTIVE"):
        c.open_due_checkpoint(oid)
    assert c.open_due_checkpoint(candidate) == "0"


def test_revision_waits_for_checkpoint_and_cannot_close_live_parent():
    c, now, _, oid = accepted()
    candidate = propose(c, oid)
    cid = c.open_due_checkpoint(oid)
    with pytest.raises(UserError, match="CHECKPOINT_IN_FLIGHT"):
        accept(c, candidate)
    fake_gl.message.sender_address.as_hex = OWNER
    with pytest.raises(UserError, match="CHECKPOINT_IN_FLIGHT"):
        c.close_obligation(oid)
    now[0] = json.loads(c.get_recovery_state(cid))["deadline"] + 1
    c.expire_checkpoint(cid)
    snapshot = c.get_checkpoint(cid)
    accept(c, candidate)
    assert c.get_checkpoint(cid) == snapshot


def test_competing_cancelled_and_stale_revisions_cannot_activate():
    c, _, _, oid = accepted()
    a = propose(c, oid, "first-revision")
    b = propose(c, oid, "second-revision")
    fake_gl.message.sender_address.as_hex = OUTSIDER
    with pytest.raises(UserError, match="PARTY_ONLY"):
        c.cancel_revision(a)
    fake_gl.message.sender_address.as_hex = COUNTERPARTY
    c.cancel_revision(a)
    with pytest.raises(UserError, match="REVISION_NOT_PENDING"):
        accept(c, a)
    d = propose(c, oid, "third-revision")
    accept(c, b)
    assert json.loads(c.get_policy_lifecycle(d))["stale"]
    with pytest.raises(UserError, match="REVISION_STALE"):
        accept(c, d)


def test_recovery_rules_are_committed_in_digest():
    c, _, _, oid = accepted()
    original = json.loads(c.get_obligation(oid))["terms_digest"]
    previous = contract_module.ASSESSMENT_GRACE
    try:
        contract_module.ASSESSMENT_GRACE += 1
        other, _, _, other_id = new_contract()
        assert json.loads(other.get_obligation(other_id))["terms_digest"] != original
    finally:
        contract_module.ASSESSMENT_GRACE = previous


def test_invalid_or_unauthorized_revision_does_not_allocate_candidate():
    c, _, _, oid = accepted()
    before = c.get_totals()
    fake_gl.message.sender_address.as_hex = OUTSIDER
    with pytest.raises(UserError, match="OWNER_ONLY"):
        c.propose_revision(oid, "replacement", "UPTIME", "New title",
            "A valid bounded requirement for replacement publication sources.",
            SOURCES, 2, "https://counter.example.com", 300, 3600, 300)
    fake_gl.message.sender_address.as_hex = OWNER
    with pytest.raises(UserError, match="INVALID_SOURCE_POLICY"):
        c.propose_revision(oid, "replacement", "UPTIME", "New title",
            "A valid bounded requirement for replacement publication sources.",
            "[]", 2, "https://counter.example.com", 300, 3600, 300)
    assert c.get_totals() == before


def test_revision_chain_keeps_both_generations_immutable():
    c, _, _, oid = accepted()
    first = propose(c, oid)
    accept(c, first)
    second = propose(c, first, "next-generation")
    accept(c, second)
    assert json.loads(c.get_policy_lifecycle(second))["revision"] == 2
    assert json.loads(c.get_policy_lifecycle(first))["successor_id"] == second
    assert json.loads(c.get_policy_lifecycle(oid))["successor_id"] == first
    assert not json.loads(c.get_obligation(first))["active"]


def test_cancelled_revision_cannot_open_or_accept_through_old_entrypoint():
    c, _, _, oid = accepted()
    candidate = propose(c, oid)
    c.cancel_revision(candidate)
    with pytest.raises(UserError, match="OBLIGATION_INACTIVE"):
        c.open_due_checkpoint(candidate)
    with pytest.raises(UserError, match="USE_ACCEPT_REVISION"):
        c.accept_obligation(candidate, json.loads(c.get_obligation(candidate))["terms_digest"])

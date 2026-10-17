from pathlib import Path


SOURCE = (Path(__file__).parents[1] / "contracts" / "ClausePilot.py").read_text(encoding="utf-8")


def test_exact_genvm_header():
    lines = SOURCE.splitlines()
    assert lines[0] == "# v0.2.16"
    assert lines[1] == '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'


def test_public_surface_is_present():
    for method in (
        "register_agreement", "accept_agreement", "add_obligation", "accept_obligation", "open_due_checkpoint",
        "assess_checkpoint", "submit_challenge", "adjudicate_challenge", "finalize_checkpoint",
        "close_obligation", "get_contract_version", "get_agreement",
        "get_obligation", "get_checkpoint", "get_totals",
    ):
        assert f"def {method}(" in SOURCE


def test_fail_closed_states_are_explicit():
    assert '"SOURCE_UNAVAILABLE"' in SOURCE
    assert '"UNRESOLVED"' in SOURCE
    assert '"STALE_CHECKPOINT"' in SOURCE
    assert '"INVALID_MODEL_OUTPUT"' in SOURCE


def test_provisional_checkpoint_requires_expiry_or_challenge_resolution():
    assert 'checkpoint.status = "PROVISIONAL"' in SOURCE
    assert 'raise gl.vm.UserError("CHALLENGE_WINDOW_OPEN")' in SOURCE
    assert 'checkpoint.status = "FINALIZED"' in SOURCE


def test_validators_independently_fetch_and_apply_comparative_consensus():
    evaluate = SOURCE.split("def evaluate", 1)[1].split("principle =", 1)[0]
    assert '_fetch(str(source["url"]), str(source["marker"]))' in evaluate
    assert "gl.nondet.exec_prompt" in evaluate
    assert "gl.eq_principle.prompt_comparative(evaluate, principle)" in SOURCE
    assert "scope_relation, coverage and semantic_state" in SOURCE
    assert "gl.eq_principle.strict_eq" not in SOURCE


def test_no_custody_or_legal_damages_surface():
    assert "gl.message.value" not in SOURCE
    assert "gl.transfer" not in SOURCE
    assert "damages" not in SOURCE.lower()


def test_receipt_ids_are_returned_by_create_methods():
    assert "return agreement_id" in SOURCE
    assert "return obligation_id" in SOURCE
    assert "return checkpoint_id" in SOURCE


def test_counterparty_accepts_exact_immutable_obligation_before_checkpoint():
    assert 'raise gl.vm.UserError("COUNTERPARTY_ONLY")' in SOURCE
    assert 'raise gl.vm.UserError("AGREEMENT_NOT_ACCEPTED")' in SOURCE
    assert "agreement.accepted = True" in SOURCE
    assert "def _obligation_terms_digest(" in SOURCE
    assert "terms_digest=terms_digest, accepted=False" in SOURCE
    assert "def accept_obligation(" in SOURCE
    assert 'raise gl.vm.UserError("TERMS_DIGEST_MISMATCH")' in SOURCE
    assert "obligation.accepted = True" in SOURCE
    assert 'raise gl.vm.UserError("OBLIGATION_NOT_ACCEPTED")' in SOURCE


def test_frontend_can_fail_closed_on_contract_schema_version():
    assert "def get_contract_version(" in SOURCE
    assert '"consent_schema": "corroborated-challenge-v1"' in SOURCE


def test_v3_policy_is_bounded_and_consent_bound():
    assert "MIN_SOURCES = 2" in SOURCE and "MAX_SOURCES = 4" in SOURCE
    assert 'raise gl.vm.UserError("INVALID_SOURCE_POLICY")' in SOURCE
    assert '"corroboration_threshold": corroboration_threshold' in SOURCE
    assert '"challenge_origin": challenge_origin' in SOURCE
    assert '"challenge_seconds": challenge_seconds' in SOURCE


def test_ai_cannot_finalize_standing_directly():
    assessment = SOURCE.split("def assess_checkpoint", 1)[1].split("def submit_challenge", 1)[0]
    finalization = SOURCE.split("def finalize_checkpoint", 1)[1].split("def close_obligation", 1)[0]
    assert "obligation.standing" not in assessment
    assert "obligation.standing = checkpoint.final_state" in finalization


def test_only_one_checkpoint_can_be_in_flight_and_schedule_is_anchored():
    assert 'raise gl.vm.UserError("CHECKPOINT_IN_FLIGHT")' in SOURCE
    assert "scheduled_due = int(obligation.next_due_at)" in SOURCE
    assert "window_start=bigint(scheduled_due)" in SOURCE
    assert "obligation.open_checkpoint_id = checkpoint_id" in SOURCE
    assert 'obligation.open_checkpoint_id = ""' in SOURCE
    assert 'challenge_decision="MISSED_SCHEDULE" if missed else ""' in SOURCE
    assert "no retrospective inference was attempted" in SOURCE


def test_assessment_waits_for_complete_sealed_observation_window():
    assessment = SOURCE.split("def assess_checkpoint", 1)[1].split("def close_obligation", 1)[0]
    gate = 'if now < int(checkpoint.window_end):'
    assert gate in assessment
    assert 'raise gl.vm.UserError("OBSERVATION_WINDOW_OPEN")' in assessment
    assert assessment.index(gate) < assessment.index("def evaluate")

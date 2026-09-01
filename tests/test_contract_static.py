from pathlib import Path


SOURCE = (Path(__file__).parents[1] / "contracts" / "ClausePilot.py").read_text(encoding="utf-8")


def test_exact_genvm_header():
    lines = SOURCE.splitlines()
    assert lines[0] == "# v0.2.16"
    assert lines[1] == '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'


def test_public_surface_is_present():
    for method in (
        "register_agreement", "accept_agreement", "add_obligation", "open_due_checkpoint",
        "assess_checkpoint", "close_obligation", "get_agreement",
        "get_obligation", "get_checkpoint", "get_totals",
    ):
        assert f"def {method}(" in SOURCE


def test_fail_closed_states_are_explicit():
    assert '"SOURCE_UNAVAILABLE"' in SOURCE
    assert '"UNRESOLVED"' in SOURCE
    assert '"STALE_CHECKPOINT"' in SOURCE
    assert '"INVALID_MODEL_OUTPUT"' in SOURCE


def test_unresolved_checkpoint_is_retryable_but_assessed_is_terminal():
    assert 'checkpoint.status not in ("OPEN", "UNRESOLVED")' in SOURCE
    assert 'checkpoint.status = "ASSESSED"' in SOURCE


def test_validators_independently_fetch_and_apply_comparative_consensus():
    evaluate = SOURCE.split("def evaluate", 1)[1].split("principle =", 1)[0]
    assert "_fetch(url, marker)" in evaluate
    assert "gl.nondet.exec_prompt" in evaluate
    assert "gl.eq_principle.prompt_comparative(evaluate, principle)" in SOURCE
    assert "scope_relation, coverage and semantic_state must match exactly" in SOURCE
    assert "gl.eq_principle.strict_eq" not in SOURCE


def test_no_custody_or_legal_damages_surface():
    assert "gl.message.value" not in SOURCE
    assert "gl.transfer" not in SOURCE
    assert "damages" not in SOURCE.lower()


def test_receipt_ids_are_returned_by_create_methods():
    assert "return agreement_id" in SOURCE
    assert "return obligation_id" in SOURCE
    assert "return checkpoint_id" in SOURCE


def test_counterparty_consent_precedes_obligation_creation():
    assert 'raise gl.vm.UserError("COUNTERPARTY_ONLY")' in SOURCE
    assert 'raise gl.vm.UserError("AGREEMENT_NOT_ACCEPTED")' in SOURCE
    assert "agreement.accepted = True" in SOURCE

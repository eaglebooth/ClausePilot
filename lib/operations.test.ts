import test from "node:test";
import assert from "node:assert/strict";
import {
  checkpointTiming,
  recoveryAdvice,
  webWriteBlock,
} from "./operations.ts";
import { validHash } from "./pending.ts";

test("AI pause covers assessment and adjudication, not deterministic recovery or revisions", () => {
  assert.ok(webWriteBlock("assess_checkpoint"));
  assert.ok(webWriteBlock("adjudicate_challenge"));
  for (const name of [
    "expire_checkpoint",
    "propose_revision",
    "accept_revision",
    "finalize_checkpoint",
  ])
    assert.equal(webWriteBlock(name), "");
});
test("deadline equality is not expiry; timing uses chain time", () => {
  const cp = { status: "OPEN", window_end: 100, challenge_deadline: 200 };
  const rs = {
    checkpoint_id: "0",
    status: "OPEN",
    deadline: 200,
    chain_time: 200,
    eligible: false,
  };
  assert.deepEqual(checkpointTiming(cp, rs), {
    windowComplete: true,
    challengeExpired: false,
    assessmentExpired: false,
  });
  assert.deepEqual(checkpointTiming(cp, { ...rs, chain_time: 201 }), {
    windowComplete: true,
    challengeExpired: true,
    assessmentExpired: true,
  });
});
test("recovery advice distinguishes authorized expiry from merely elapsed time", () => {
  const rs = {
    checkpoint_id: "0",
    status: "OPEN",
    deadline: 100,
    chain_time: 101,
    eligible: false,
  };
  assert.match(recoveryAdvice(rs), /not authorized/);
  assert.match(recoveryAdvice({ ...rs, eligible: true }), /UNRESOLVED/);
  assert.match(recoveryAdvice({ ...rs, chain_time: 100 }), /not due/);
  assert.match(recoveryAdvice({ ...rs, deadline: 0 }), /No timeout/);
});
test("only complete hexadecimal hashes are accepted", () => {
  assert.ok(validHash("0x" + "a".repeat(64)));
  assert.equal(validHash("0x123"), false);
  assert.equal(validHash("0x" + "z".repeat(64)), false);
});

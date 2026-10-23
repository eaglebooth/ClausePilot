import test from "node:test";
import assert from "node:assert/strict";
import { finalizedFailure } from "./finality.ts";

const success = {
  statusName: "FINALIZED",
  resultName: "AGREE",
  consensus_data: {
    leader_receipt: [
      {
        execution_result: "SUCCESS",
        result: { status: "return", payload: { readable: "0" } },
      },
    ],
  },
};
test("requires finalized status, not merely accepted", () =>
  assert.match(
    finalizedFailure({ ...success, statusName: "ACCEPTED" }),
    /finalized/i,
  ));
test("requires explicit consensus and leader execution", () => {
  assert.ok(finalizedFailure({ ...success, resultName: "DISAGREE" }));
  assert.ok(finalizedFailure({ statusName: "FINALIZED", resultName: "AGREE" }));
});
test("accepts verified success without treating validator history as outcome", () =>
  assert.equal(
    finalizedFailure({ ...success, old_attempt: { status: "ERROR" } }),
    "",
  ));
test("preserves exact rollback reason", () =>
  assert.match(
    finalizedFailure({
      ...success,
      consensus_data: {
        leader_receipt: [
          {
            execution_result: "ERROR",
            result: { status: "rollback", payload: "COUNTERPARTY_ONLY" },
          },
        ],
      },
    }),
    /COUNTERPARTY_ONLY/,
  ));
test("failed consensus exposes final result without treating it as execution success", () =>
  assert.match(
    finalizedFailure({ ...success, resultName: "MAJORITY_DISAGREE" }),
    /MAJORITY_DISAGREE/,
  ));
test("contract_error is a rejection even when consensus agreed", () =>
  assert.match(
    finalizedFailure({
      ...success,
      consensus_data: {
        leader_receipt: [
          {
            execution_result: "ERROR",
            result: { status: "contract_error", payload: "CHALLENGE_NOT_OPEN" },
          },
        ],
      },
    }),
    /CHALLENGE_NOT_OPEN/,
  ));

/** Web release guard only. The deployed contract itself is unchanged. */
export function webWriteBlock(method: string): string {
  return method === "assess_checkpoint" || method === "adjudicate_challenge"
    ? "AI writes are paused in this web release because repeated assessment consensus is not yet verified as reliable. Read state, review evidence, or recover an eligible stalled checkpoint. The deployed contract is unchanged."
    : "";
}

export type CheckpointTiming = {
  status: string;
  window_end: number;
  challenge_deadline: number;
};
export type RecoveryTiming = {
  checkpoint_id: string;
  status: string;
  deadline: number;
  chain_time: number;
  eligible: boolean;
};

export function checkpointTiming(
  cp: CheckpointTiming,
  recovery: RecoveryTiming,
) {
  return {
    windowComplete: recovery.chain_time >= cp.window_end,
    challengeExpired:
      cp.challenge_deadline > 0 && recovery.chain_time > cp.challenge_deadline,
    assessmentExpired:
      cp.status === "OPEN" &&
      recovery.deadline > 0 &&
      recovery.chain_time > recovery.deadline,
  };
}

export function recoveryAdvice(state: RecoveryTiming): string {
  if (state.eligible)
    return "Recovery is eligible at the last synchronized chain time. Expire as UNRESOLVED to release the checkpoint; this does not establish compliance or breach.";
  if (!state.deadline)
    return "No timeout recovery applies to this checkpoint state. Read its final standing or continue the permitted deterministic lifecycle.";
  if (state.chain_time > state.deadline)
    return "Deadline passed, but recovery is not authorized by the current contract state. Sync and inspect the policy lifecycle; do not submit blindly.";
  return "Recovery is not due yet. The deadline is strict: chain time must be later than the deadline. Sync again after it passes; your device clock is not authoritative.";
}

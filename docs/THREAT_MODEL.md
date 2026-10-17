# Threat model

## Protected assets

Agreement identity, counterparty binding, source policy, checkpoint sequence, semantic standing and append-only observation history.

## Adversaries

- owner attempting to bind a deceptive source;
- unrelated caller attempting to mutate configuration;
- source publishing content for the wrong object;
- evidence containing prompt injection;
- stale checkpoint or observation attempting to overwrite a terminal result;
- owner selecting mutually dependent or misleading corroboration sources;
- counterparty submitting late, mutable or out-of-policy counter-evidence;
- model returning malformed or internally inconsistent output;
- frontend inferring IDs or showing optimistic success.

## Controls

- 2–4 exact normalized HTTPS source policies and bounded threshold;
- two-stage counterparty consent: agreement acceptance, then acceptance of an
  immutable digest covering the exact obligation, source policy and schedule;
- required object marker and validator-local fetched snapshot hash;
- independent validator refetch and semantic recomputation;
- immutable agreement-version and checkpoint-sequence binding; a new agreement
  version is a new agreement record in the MVP;
- checkpoints cannot open before exact obligation consent and cannot be assessed
  before the sealed observation window ends;
- positive results require scope match and sufficient coverage;
- provisional findings cannot mutate standing;
- one counterparty-only, origin-bound, digest-bound challenge before deadline;
- challenged and unchallenged findings require replay-safe finalization;
- source/model failure becomes `UNRESOLVED`;
- frontend decodes finalized return IDs and reconciles authoritative readback.

## Residual risks

Multiple pages can repeat the same false upstream claim and therefore are not
automatically independent attestations. Public content can change between
validators. Counter-evidence may also be incomplete or adversarial. V3 reports
bounded corroboration of published evidence; it does not establish legal
liability, continuous uptime or universal objective truth.

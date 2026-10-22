# V4 deployment handoff

1. In GenLayer Studio, select StudioNet.
2. Deploy the complete current `contracts/ClausePilot.py`; constructor takes no arguments.
3. Return the newly deployed address to the project owner workflow.
4. Run `node scripts/verify-v4-deployment.mjs ADDRESS`; require sourceParity and schemaValid.
5. Record source SHA-256, deployment transaction and network address.
6. Run two-wallet agreement and obligation consent, checkpoint assessment,
   challenge, adjudication and finalization.
7. Open another checkpoint and wait until its observation end plus 3600 seconds;
   prove early expiry rejection, late assessment rejection and successful expiry
   to UNRESOLVED. Confirm the in-flight marker clears and schedule stays anchored.
8. Propose a complete successor policy using a unique obligation key. Verify
   owner cannot accept it, wrong digest rejects, and a live parent checkpoint
   blocks acceptance. Counterparty accepts after finalization/recovery.
9. Verify parent/successor links, revision number, retired parent, fresh successor
   schedule and UNRESOLVED standing. Old checkpoint readback must remain unchanged.
10. Add direct Explorer links and final reads to live evidence; update production
    environment, deploy frontend, smoke-test routes and check the bundled address.

Current production remains the verified V3 address
`0x0350c736033bE5b0e66a15512475D12d573412A4`. The ignored local environment remains
on that address until the new deployment is validated. The local V4 frontend
therefore intentionally rejects the V3 handshake.

# AIDA — Agent Identity & Delegation Attestation

**The open protocol for agent identity, delegation, and attestation.**

AIDA defines how AI agents prove who they are, what they're authorized to do, and that they did it correctly — in a standardized, verifiable, blockchain-agnostic way.

> Establishing zero-trust cryptographic provenance, non-repudiation, and transparent auditability for autonomous AI agents on the web.

---

## The Problem

AI agents are increasingly autonomous — making purchases, accessing APIs, modifying systems, and acting on behalf of humans. But the ecosystem has no standard way to:

1. **Identify** an agent — is this agent who it claims to be?
2. **Delegate** authority — what is this agent authorized to do, and who authorized it?
3. **Attest** behavior — can I verify what this agent actually did?

Every integration hand-wires its own identity solution (API keys, service accounts, bespoke JWTs). Cross-agent trust is nonexistent. Regulatory compliance (EU AI Act, NIST AI RMF, California ADT) demands audit trails that don't exist.

**AIDA fixes this.**

---

## Three-Layer Architecture

```
┌────────────────────────────────────────────────────┐
│                   AIDA Protocol                    │
│                                                    │
│  LAYER 1: IDENTITY                                 │
│  ┌──────────────────────────────────────────────┐  │
│  │ aida:<ed25519-pubkey>                        │  │
│  │ Identity Document (JSON-LD, signed)          │  │
│  │ Soul Hash (integrity fingerprint)            │  │
│  │ Key rotation & revocation                    │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  LAYER 2: DELEGATION                               │
│  ┌──────────────────────────────────────────────┐  │
│  │ Capability Grants (typed, constrained)       │  │
│  │ Delegation Chains (A → B → C)                │  │
│  │ Consent Routing (risk-graduated HITL)        │  │
│  │ Claim Narrowing (minimal disclosure)         │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  LAYER 3: ATTESTATION                              │
│  ┌──────────────────────────────────────────────┐  │
│  │ Action Receipts (W3C Verifiable Credentials) │  │
│  │ Hash-Chained Audit Trail                     │  │
│  │ Extensible Trust Scoring                     │  │
│  │ Verification Profiles (local, DNS, ZK, ...)  │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## Quick Start

### Identity (Layer 1)

```json
{
  "id": "aida:CcL7R8YxPZnJ2YqkMoF1mBvQrWtLxU9k",
  "controller": "alice@example.com",
  "publicKey": {
    "type": "Ed25519VerificationKey2020",
    "publicKeyBase58": "CcL7R8YxPZnJ2YqkMoF1mBvQrWtLxU9k"
  },
  "soulHash": "sha256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730",
  "created": "2026-06-13T00:00:00Z"
}
```

### Delegation (Layer 2)

```json
{
  "id": "urn:uuid:grant-abc123",
  "issuer": "aida:CcL7R8YxPZnJ2YqkMoF1mBvQrWtLxU9k",
  "subject": "aida:DdM8S9ZqAoK3XrlNpG2nCwRsTuVy0Wa",
  "capabilities": [{
    "action": "read",
    "resource": "files:/home/alice/projects/*",
    "riskLevel": "low"
  }],
  "issuedAt": "2026-06-13T00:00:00Z"
}
```

### Attestation (Layer 3)

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "AidaAttestationReceipt"],
  "issuer": "aida:DdM8S9ZqAoK3XrlNpG2nCwRsTuVy0Wa",
  "credentialSubject": {
    "id": "aida:DdM8S9ZqAoK3XrlNpG2nCwRsTuVy0Wa",
    "action": {
      "type": "tool_call",
      "tool": "read_file",
      "riskLevel": "low"
    },
    "timestamp": "2026-06-13T01:23:45Z",
    "previousReceipt": "sha256:abc123def456..."
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2026-06-13T01:23:45Z",
    "proofValue": "z3uTAiGz..."
  }
}
```

---

## Web Agent Identity

AIDA's most immediately actionable extension. When an AI agent browses the web, websites have no standard way to know who it is. 32% of web traffic is automated, but agents use spoofable User-Agent strings. AIDA Web Agent Identity fixes this with one signed HTTP header.

```http
GET /api/data HTTP/1.1
Host: example.com
Aida-Agent: aida:CcL7R8YxPZnJ2YqkMoF1mBvQrWtLxU9k
Aida-Purpose: inference
Signature-Input: sig1=("@method" "@path" "@authority" "content-digest" "aida-agent");keyid="aida:CcL7R8...";created=1719000000;alg="ed25519"
Signature: sig1=:z3uTAiGz...:
```

**Agent side** (`@aida/attest`):
```typescript
import { createAgent, signRequest } from '@aida/attest';
const agent = await createAgent({ controller: { email: 'alice@example.com' } });
const req = await signRequest('https://api.example.com/data', { method: 'GET', agent });
```

**Server side** (`@aida/verify`):
```typescript
import { verifyAgent } from '@aida/verify';
app.use(verifyAgent());  // One line. Every request now has req.aida.
```

Read the full specification: [Web Agent Identity](./docs/specification/draft/web-agent-identity.mdx)

---

## Repository Structure

```
aida-spec/
├── schema/
│   └── draft/
│       ├── schema.json          # JSON Schema 2020-12 (canonical)
│       ├── schema.ts            # TypeScript types (derived)
│       └── examples/            # Example documents
├── docs/
│   └── specification/
│       └── draft/
│           ├── index.mdx         # Architecture overview
│           ├── identity/         # Layer 1 specification
│           ├── delegation/       # Layer 2 specification
│           ├── attestation/      # Layer 3 specification
│           ├── discovery.mdx     # DNS + .well-known discovery
│           ├── profiles.mdx      # Verification profiles
│           └── schema.mdx        # Schema reference
├── README.md
├── GOVERNANCE.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## Design Principles

1. **Blockchain-agnostic.** AIDA defines data models and verification rules. Blockchain verification is an optional profile, not a requirement.

2. **One key type.** Ed25519 only. No RSA, no ECDSA. Simplicity reduces attack surface.

3. **W3C Verifiable Credentials.** Attestation receipts are standard VCs, enabling interoperability with existing VC verifiers.

4. **Progressive disclosure.** Claim narrowing ensures minimal information exposure — a capability grant for "read files" doesn't leak the agent's full identity.

5. **Composable profiles.** AIDA-Local (offline Ed25519), AIDA-DNS (DNSSEC-anchored), AIDA-Ledger (on-chain), AIDA-ZK (zero-knowledge). Profiles are pluggable.

---

## Relationship to AIXA and MCP

| Protocol | Purpose | AIDA Relationship |
|---|---|---|
| **AIXA** (Agent Interaction & eXecution Agreement) | How agents interact (tool calls, HITL, streaming) | AIXA messages carry `aida:` identity claims for verification |
| **MCP** (Model Context Protocol) | How agents access tools and resources | AIDA agents expose identity/verification as MCP tools |
| **AIDA** | Agent identity, delegation, attestation | The trust layer beneath interactions |

---

## Status

**Draft.** AIDA is under active development. The `draft/` directory contains work-in-progress specifications. When AIDA reaches v1.0, content will move to dated directories (e.g., `schema/2026-XX-XX/`).

## License

Apache-2.0 — see [LICENSE](./LICENSE).

## Acknowledgments

The AIDA protocol specification builds upon foundational concepts across the decentralized identity, cryptography, and autonomous systems communities. We acknowledge the contributions and prior research across the broader ecosystem—including early explorations in agent identity, cryptographic capability attestation, and zero-knowledge proofs—that helped shape the principles of secure agent verification.

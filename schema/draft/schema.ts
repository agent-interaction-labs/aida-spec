/**
 * AIDA — Agent Identity and Delegation Architecture
 * TypeScript type definitions derived from the canonical JSON Schema.
 *
 * Generated from: schema/draft/schema.json
 * Schema version: draft
 * JSON Schema: 2020-12
 */

// ─── Primitives ───────────────────────────────────────────────────────────────

/** AIDA agent identifier: aida:<base58-encoded-ed25519-public-key> */
export type AidaUri = `aida:${string}`;

/** Ed25519 public key for cryptographic verification */
export interface Ed25519VerificationKey {
  type: "Ed25519VerificationKey2020";
  /** Base58-encoded 32-byte Ed25519 public key */
  publicKeyBase58: string;
}

/** Ed25519 cryptographic signature proof */
export interface Ed25519Signature {
  type: "Ed25519Signature2020";
  /** ISO 8601 timestamp */
  created: string;
  /** Base58-encoded signature */
  proofValue: string;
  /** URI identifying the verification key */
  verificationMethod: string;
}

/** SHA-256 integrity fingerprint (soul hash or receipt chain link) */
export type HashLink = `sha256:${string}`;

/** ISO 8601 duration string (e.g., "PT1H", "P1D") */
export type IsoDuration = string;

// ─── Service Endpoints ────────────────────────────────────────────────────────

export type AgentProtocol =
  | "mcp"
  | "aip"
  | "a2a"
  | "openapi"
  | "grpc"
  | "graphql"
  | "websocket";

export interface AidaEndpoint {
  url: string;
  protocol: AgentProtocol;
  metadata?: Record<string, unknown>;
}

// ─── Controller ───────────────────────────────────────────────────────────────

/** Human or organizational controller of an agent identity */
export interface Controller {
  did?: string;
  email?: string;
  dns?: string;
  oauth?: string;
}

// ─── Layer 1: Identity ───────────────────────────────────────────────────────

export type VerificationProfileType = "local" | "dns" | "ledger" | "zk";

export interface LocalVerification {
  publicKeyBase58: string;
}

export interface DnsVerification {
  domain: string;
  requireDnssec?: boolean;
}

export interface LedgerVerification {
  chainId?: number;
  chainName?: string;
  contractAddress?: string;
  verifierFunction?: string;
}

export interface ZkVerification {
  provingSystem?: string;
  circuitHash?: string;
  verifierContract?: string;
}

export interface VerificationProfile {
  type: VerificationProfileType;
  local?: LocalVerification;
  dns?: DnsVerification;
  ledger?: LedgerVerification;
  zk?: ZkVerification;
}

/**
 * Layer 1: AIDA Identity Document.
 * The root of trust for an agent identity. Self-signed by the agent's Ed25519 key.
 */
export interface AidaIdentityDocument {
  "@context"?: string[];
  /** aida:<base58-encoded-ed25519-public-key> */
  id: AidaUri;
  controller: Controller;
  publicKey: Ed25519VerificationKey;
  /** Integrity fingerprint of identity files */
  soulHash?: HashLink;
  endpoints?: AidaEndpoint[];
  capabilities?: string[];
  verification?: VerificationProfile[];
  created: string;
  updated?: string;
  expires?: string;
  proof?: Ed25519Signature;
}

// ─── Layer 2: Delegation ─────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Constraints on a delegated capability */
export interface CapabilityConstraint {
  maxCount?: number;
  timeWindow?: IsoDuration;
  maxValue?: number;
  allowedDomains?: string[];
  ipAllowlist?: string[];
  requireConsent?: boolean;
}

/** A single delegated capability */
export interface Capability {
  action: string;
  resource: string;
  constraints?: CapabilityConstraint;
  riskLevel?: RiskLevel;
}

/**
 * Layer 2: AIDA Capability Grant.
 * Delegates capabilities from an issuer to a subject agent. Supports chaining.
 */
export interface AidaCapabilityGrant {
  id: string;
  issuer: AidaUri;
  subject: AidaUri;
  capabilities: Capability[];
  delegationChain?: AidaCapabilityGrant[];
  previousGrant?: HashLink;
  policyUri?: string;
  issuedAt: string;
  expiresAt?: string;
  revocationUri?: string;
  proof?: Ed25519Signature;
}

// ─── Layer 3: Attestation ────────────────────────────────────────────────────

export type ActionType =
  | "tool_call"
  | "delegation"
  | "identity_claim"
  | "key_rotation"
  | "capability_exercise";

export type AttestationRiskLevel = "low" | "medium" | "high";

/** An agent action recorded in an attestation receipt */
export interface AidaAction {
  type: ActionType;
  tool?: string;
  toolParameters?: Record<string, unknown>;
  toolResult?: Record<string, unknown>;
  resourceUri?: string;
  riskLevel: AttestationRiskLevel;
  timestamp: string;
  duration?: number;
}

/**
 * Layer 3: AIDA Attestation Receipt.
 * A W3C Verifiable Credential recording an agent action, hash-linked to form
 * a tamper-evident audit trail.
 */
export interface AidaAttestationReceipt {
  "@context": string[];
  type: string[];
  id?: string;
  issuer: AidaUri;
  issuanceDate: string;
  credentialSubject: {
    id: AidaUri;
    action: AidaAction;
    previousReceipt?: HashLink;
    sessionId?: string;
    grantId?: string;
  };
  proof: Ed25519Signature;
}

// ─── Receipt Chain ───────────────────────────────────────────────────────────

/** A verified chain of attestation receipts */
export interface AidaReceiptChain {
  agent: AidaUri;
  receipts: AidaAttestationReceipt[];
  verified: boolean;
  verificationErrors?: string[];
}

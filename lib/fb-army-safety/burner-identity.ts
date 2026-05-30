/**
 * @deprecated CMD-W27-A · World-B wind-down (2026-05-30).
 * Burner-identity validator presupposes the existence of synthetic burner
 * accounts (Meta ToS ban-evasion class). DO NOT ACTIVATE. Retained
 * @deprecated for git history. Barrel re-export in index.ts is transitively
 * deprecated · callers should not import.
 * Sibling safety primitives (isolation.ts · pace-floor.ts · kill-switch.ts)
 * remain ACTIVE — they are generic safety guards reusable beyond burner.
 */
// CMD-W24-L1 · FB-Army Meta-Safety · burner identity validator [DEPRECATED W27-A]
// REJECT any burner identity that overlaps Ryan's real account or the Meta
// dev account. Synthetic email pattern enforced. ZERO real-identity overlap.

/**
 * Hardcoded deny-list pattern. Any email/name/handle matching these is REAL
 * (Ryan, Legacy-Loop, Meta dev account) and MUST NEVER be used as a burner.
 */
export const REAL_IDENTITY_PATTERNS: ReadonlyArray<RegExp> = [
  /ryan/i,
  /hallee/i,
  /legacyloop(maine)?/i,
  /legacy-?loop/i,
  /annalyse07/i, // test account
  /@gmail\.com$/i, // Ryan personal domain
  /meta-?dev/i,
  /meta-?app/i,
  /facebook-?dev/i,
];

/**
 * Synthetic email pattern · burner emails MUST match one of these shapes:
 *   burner-<digits>@<synthetic-domain>
 *   burner_<digits>@<synthetic-domain>
 *   fb-army-<digits>@<synthetic-domain>
 *
 * Allowed synthetic domains: typical disposable / privacy / catch-all.
 */
export const SYNTHETIC_EMAIL_RE =
  /^(burner|fb-army)[-_]\d+@(proton(mail)?\.me|tutanota\.com|simplelogin\.io|duck\.com|tempmail\.dev|burner-domain\.test)$/i;

export type BurnerIdentity = {
  readonly accountId: string; // tag like "burner-001"
  readonly email: string;
  readonly displayName?: string;
  readonly phoneE164?: string;
  readonly notes?: string;
};

export type IdentityViolation = {
  readonly kind: "real-overlap" | "non-synthetic-email" | "missing-field";
  readonly detail: string;
};

export type IdentityVerdict = {
  readonly ok: boolean;
  readonly violations: ReadonlyArray<IdentityViolation>;
};

/**
 * Validate one burner identity. Reject if any field overlaps real-identity
 * patterns OR if email is not synthetic.
 */
export function validateBurnerIdentity(id: BurnerIdentity): IdentityVerdict {
  const violations: IdentityViolation[] = [];

  if (!id.accountId || !id.email) {
    violations.push({ kind: "missing-field", detail: "accountId+email required" });
  }

  const fields: Array<{ name: string; value: string | undefined }> = [
    { name: "accountId", value: id.accountId },
    { name: "email", value: id.email },
    { name: "displayName", value: id.displayName },
    { name: "phoneE164", value: id.phoneE164 },
    { name: "notes", value: id.notes },
  ];

  for (const f of fields) {
    if (!f.value) continue;
    for (const re of REAL_IDENTITY_PATTERNS) {
      if (re.test(f.value)) {
        violations.push({
          kind: "real-overlap",
          detail: `${f.name} matches real-identity pattern ${re.source}: ${f.value}`,
        });
      }
    }
  }

  if (id.email && !SYNTHETIC_EMAIL_RE.test(id.email)) {
    violations.push({
      kind: "non-synthetic-email",
      detail: `email ${id.email} is not a synthetic burner pattern`,
    });
  }

  return { ok: violations.length === 0, violations };
}

/**
 * Audit a full roster. Returns per-identity verdicts + roster-wide ok flag.
 */
export function auditBurnerRoster(roster: ReadonlyArray<BurnerIdentity>): {
  ok: boolean;
  results: ReadonlyArray<{ accountId: string; verdict: IdentityVerdict }>;
} {
  const results = roster.map((id) => ({
    accountId: id.accountId,
    verdict: validateBurnerIdentity(id),
  }));
  return {
    ok: results.every((r) => r.verdict.ok),
    results,
  };
}

#!/usr/bin/env node
// scripts/router-smoke.mjs
//
// CMD-SYLVIA-AI-ROUTER-V1 V20 v2.1 R29 P76 · §5.X Gate 2 smoke
//
// Validates routeTask() tier mapping against 5 sample prompts.
// Pure JS · zero AI calls · zero LiteLLM dependency · zero Prisma touch
// (omits sessionId on samples so safeEpisodicEmit branch is skipped).
//
// Inlines the rule-based classifier from triage-router.ts L121 for
// runtime independence. Substrate wire proven by tsc=0 + npm run build.
// This smoke proves tier-mapping math + cheap-first cascade is correct.
//
// Run: node scripts/router-smoke.mjs

// ─── Inlined tier policy snapshot (mirrors lib/sylvia/router.ts) ────

const TIER_POLICIES = {
  T1: {
    tier: "T1",
    aliases: ["llama-3.2-local", "qwen-coder-2.5-local", "deepseek-r1-local"],
    costCeilingPerCallUsd: 0.001,
    costCeilingPerSessionUsd: 0.02,
  },
  T2: {
    tier: "T2",
    aliases: ["gpt-4o-mini", "gemini-2.5-flash"],
    costCeilingPerCallUsd: 0.01,
    costCeilingPerSessionUsd: 0.2,
  },
  T3: {
    tier: "T3",
    aliases: ["claude-haiku-4-5", "gemini-2.5-flash", "grok-4"],
    costCeilingPerCallUsd: 0.1,
    costCeilingPerSessionUsd: 2.0,
  },
};

// ─── Inlined classifier from triage-router.ts L121 ────────────────

const RX_CODE_FENCE = /```/;
const RX_COMPLEX_KW =
  /\b(refactor|debug|architecture|review|analyze|synthesize|cross-reference)\b/i;
const RX_RESEARCH_KW = /\b(research|cite|sources|current|live)\b/i;

function classifyComplexity(task) {
  if (task.forceAlias) return { complexity: "specialized", classifier: "force-alias" };
  if (task.complexityHint) return { complexity: task.complexityHint, classifier: "hint-override" };
  if (task.requiresLiveWeb) return { complexity: "specialized", classifier: "rule-based" };
  if (task.requiresLocal) return { complexity: "simple", classifier: "rule-based" };
  const p = task.prompt;
  const len = p.length;
  if (RX_RESEARCH_KW.test(p)) return { complexity: "specialized", classifier: "rule-based" };
  if (RX_CODE_FENCE.test(p) || RX_COMPLEX_KW.test(p))
    return { complexity: "complex", classifier: "rule-based" };
  if (len > 1500) return { complexity: "complex", classifier: "rule-based" };
  if (len < 200) return { complexity: "simple", classifier: "rule-based" };
  return { complexity: "medium", classifier: "rule-based" };
}

function mapComplexityToTier(complexity, patternHint) {
  const effective = patternHint ?? complexity;
  switch (effective) {
    case "simple":
      return "T1";
    case "medium":
      return "T2";
    case "complex":
    case "specialized":
      return "T3";
    default:
      return "T2";
  }
}

function routeTaskLocal(task) {
  if (task.forceAlias) {
    const tier = (["T1", "T2", "T3"]).find((t) =>
      TIER_POLICIES[t].aliases.includes(task.forceAlias),
    ) ?? "T2";
    return { tier, chosenAlias: task.forceAlias, classifier: "force-alias" };
  }
  if (task.forceTier) {
    const policy = TIER_POLICIES[task.forceTier];
    return {
      tier: task.forceTier,
      chosenAlias: policy.aliases[0],
      classifier: "force-tier",
    };
  }
  const { complexity, classifier } = classifyComplexity(task);
  const tier = mapComplexityToTier(complexity);
  const policy = TIER_POLICIES[tier];
  return {
    tier,
    chosenAlias: policy.aliases[0],
    classifier: "complexity-rule",
    rationale: `complexity=${complexity} · classifier=${classifier} · tier=${tier}`,
    fallbackCascade: policy.aliases.slice(1),
  };
}

// ─── §5.X Gate 2 sample task suite ─────────────────────────────────

const SAMPLES = [
  {
    label: "1 · greeting (short)",
    task: { prompt: "Hello, what time is it?" },
    expectedTier: "T1",
  },
  {
    label: "2 · medium explainer",
    task: {
      prompt:
        "Explain quantum entanglement in a few paragraphs for a curious reader who already knows basic physics, focusing on Bell inequalities, the EPR paradox, and how measurement collapses correlated states across spacelike-separated observers without superluminal signaling.",
    },
    expectedTier: "T2",
  },
  {
    label: "3 · code refactor",
    task: {
      prompt:
        "```ts\nfunction foo() {}\n```\nRefactor this 200-line component into smaller pieces and add tests.",
    },
    expectedTier: "T3",
  },
  {
    label: "4 · live web research",
    task: {
      prompt: "Latest news on Tesla earnings",
      requiresLiveWeb: true,
    },
    expectedTier: "T3",
  },
  {
    label: "5 · medium translation",
    task: {
      prompt:
        "Translate the following passage to French. Preserve sentence structure, idiom, and register where possible; flag any phrases that have no direct French equivalent. Passage: The quick brown fox jumps over the lazy dog and afterwards reflects on the philosophical implications of inter-species athleticism, the durability of common-tongue idioms, and the role of pangrams in early printing-press calibration tests.",
    },
    expectedTier: "T2",
  },
];

console.log("\n═══ TIER POLICY SNAPSHOT ═══");
for (const tier of ["T1", "T2", "T3"]) {
  const p = TIER_POLICIES[tier];
  console.log(
    `${tier}: aliases=[${p.aliases.join(", ")}] · ceiling/call=$${p.costCeilingPerCallUsd} · ceiling/session=$${p.costCeilingPerSessionUsd}`,
  );
}
console.log("");

let pass = 0;
let fail = 0;

for (const sample of SAMPLES) {
  const decision = routeTaskLocal(sample.task);
  const ok = decision.tier === sample.expectedTier;
  if (ok) pass++;
  else fail++;
  console.log(
    `${ok ? "✅" : "❌"} ${sample.label} → tier=${decision.tier} (expected ${sample.expectedTier}) · alias=${decision.chosenAlias} · classifier=${decision.classifier}`,
  );
  if (decision.rationale) console.log(`     ${decision.rationale}`);
  if (decision.fallbackCascade)
    console.log(`     fallback: [${decision.fallbackCascade.join(", ")}]`);
}

console.log("");
console.log(`═══ RESULT: ${pass}/${SAMPLES.length} PASS · ${fail} FAIL ═══`);
process.exit(fail === 0 ? 0 : 1);

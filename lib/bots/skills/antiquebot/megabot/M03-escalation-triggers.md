---
name: antiquebot-megabot-escalation-triggers
description: >
  Defines the specific conditions under which AntiqueBot MegaBot must
  recommend human expert involvement. Covers the five non-negotiable
  escalation scenarios, physical inspection red flags that AI cannot
  resolve from photographs, legal and insurance implications of AI-only
  appraisal, and the communication standards for delivering an escalation
  recommendation to a seller with dignity and clarity.
when_to_use: >
  Evaluate these triggers at the end of every MegaBot synthesis pass,
  before generating the final output. If any single trigger is met, the
  output must include an escalation recommendation. If two or more
  triggers are met, the escalation must be the primary recommendation,
  positioned above the valuation estimate.
version: "1.0.0"
---

# Escalation Triggers: When MegaBot Must Recommend a Human Appraiser

## Governing Principle

Artificial intelligence working from photographs can accomplish
remarkable things. It can identify period, style, maker's marks,
condition grade, and comparable sales. It cannot smell. It cannot feel
the weight of a piece in its hands. It cannot shine an ultraviolet lamp
across a surface to reveal restored areas invisible in daylight. It
cannot open a drawer and examine the secondary wood, the hand-cut
dovetails, the patina on the inside face of a panel that was never meant
to be seen.

The honest measure of a good AI system is not what it claims to know.
It is what it knows it does not know.

This skill defines the precise thresholds at which AntiqueBot MegaBot
must set aside its valuation function and direct the seller toward a
qualified human professional.

---

## The Five Non-Negotiable Escalation Scenarios

### Scenario 1: Estimated Value Exceeds $10,000

At values above $10,000, the financial stakes exceed what any AI
system can responsibly underwrite from photographs. The difference
between an authentic period piece and a high-quality reproduction can
be $50,000 or more. That difference can only be resolved through
physical examination by a specialist.

The threshold is not arbitrary. It corresponds approximately to the
lower bound at which major insurance carriers require a certified
appraisal for scheduled coverage, and to the IRS threshold above which
a qualified appraisal is required for charitable contribution deductions.

Trigger: Midpoint estimate or high estimate exceeds $10,000.

### Scenario 2: The Four AI Models Disagree by More Than 40 Percent

When the highest model estimate and the lowest model estimate diverge
by more than 40 percent of the lower figure, the disagreement itself is
diagnostic. It signals that the item is ambiguous: ambiguous attribution,
ambiguous condition, ambiguous period, or ambiguous authenticity. A
human specialist resolves ambiguity by handling the piece.

Report the range transparently, note the disagreement, and explain
that the spread reflects genuine uncertainty that photographs cannot
resolve.

Trigger: (High model estimate minus low model estimate) divided by
low model estimate exceeds 0.40.

### Scenario 3: Signature, Mark, or Label Cannot Be Confirmed from Photographs

Maker's marks, signatures, foundry stamps, guild marks, silversmiths'
hallmarks, paper labels, and stenciled attributions are the most common
target of forgery and misattribution in the antiques market. When a
photograph of a mark is blurry, partially obscured, or ambiguous in any
way, AI must not attempt to authenticate it.

Authentication of a signature requires comparison against a reference
database of known authentic signatures under controlled lighting. It
often requires examination under magnification. In some cases it requires
infrared reflectography or multispectral imaging.

Trigger: Any AI model flags uncertainty about a mark, signature, or
attribution that is central to the valuation.

### Scenario 4: Evidence of Restoration, Repair, or Alteration is Present

Photographs can reveal obvious restoration: mismatched finish, visible
fills, color variation in upholstery. They cannot reveal subtle restoration:
inpainting on a canvas that matches the original pigment, replaced veneer
that was carefully aged, a replaced hardware element that has been chemically
patinated to match period originals.

When any AI model notes visual evidence consistent with restoration,
the seller must be advised that the extent of restoration can only be
assessed by hands-on examination. Restoration significantly affects
value and disclosure obligations.

Trigger: Any AI model notes condition language including restoration,
repair, replaced, refinished, overpainting, conservation, or alteration.

### Scenario 5: Legal, Insurance, or Estate Context Requires USPAP Compliance

If the seller indicates that the item will be used for: an IRS charitable
contribution deduction, an estate tax filing, a divorce settlement, an
insurance claim, litigation, or a museum donation, the appraisal must
be performed by a Qualified Appraiser under Uniform Standards of
Professional Appraisal Practice. An AI output does not qualify under
any of these standards.

This is not a limitation — it is a legal fact. Advising a seller to use
an AI valuation for IRS purposes when that valuation is not USPAP-compliant
would expose the seller to penalties.

Trigger: Seller mentions estate, insurance, donation, tax, divorce,
legal, or claim in any context.

---

## Physical Inspection Red Flags AI Cannot Resolve

The following conditions require physical examination. Photographs may
suggest these issues but cannot confirm or rule them out.

Ultraviolet examination: UV light reveals restorations, inpainting,
replaced veneer, and surface coatings invisible in normal light. A
piece that appears pristine in a photograph may show extensive
restoration under UV. This is the single most common deception in the
furniture and painting markets.

Weight assessment: Cast iron versus pot metal, solid silver versus
silver plate, marble versus cultured stone, jade versus serpentine —
these distinctions often require weighing the piece or assessing
resistance to a file or needle point. Weight also reveals hollow
versus solid construction in bronzes, distinguishing original casts
from later recasts.

Construction behind surfaces: The inside face of a drawer front, the
back of a panel, the underside of a tabletop — these surfaces tell the
story of how and when a piece was made. Hand-cut dovetails versus
machine-cut, secondary woods consistent with the stated period and
region, evidence of original finish under later overcoats. These details
are inaccessible from exterior photographs.

Under-glaze marks and kiln furniture: On ceramics, marks on the base
are sometimes photographed but the photograph cannot reveal whether the
mark was applied before or after firing, whether the body is consistent
with the mark's claimed origin, or whether the glaze chemistry matches
the period. A specialist with a loupe and a reference collection can
resolve these questions in minutes.

Tool marks and construction methods: Period hand tools leave specific
marks that differ from power tools. The width of saw kerfs, the
irregularity of plane marks, the character of turned elements — these
distinguish period work from later reproductions. They require direct
visual examination under raking light, which photographs rarely provide.

---

## Legal and Insurance Implications of AI-Only Appraisal

The Uniform Standards of Professional Appraisal Practice, promulgated
by The Appraisal Foundation, govern appraisals used for legal, tax,
and insurance purposes in the United States. USPAP requires that an
appraisal be performed by a qualified appraiser who has personally
examined the property. AI output does not satisfy this requirement.

IRS Form 8283, required for non-cash charitable contributions exceeding
$500, requires the signature of a Qualified Appraiser as defined in
IRC Section 170(f)(11)(E). An AI-generated valuation cannot serve as
the basis for this form.

Insurance carriers offering scheduled personal property coverage require
appraisals performed by accredited appraisers for items above their
individual thresholds, typically $5,000 to $10,000. An AI valuation
will not satisfy these requirements and may void a claim.

In estate and probate contexts, date-of-death valuations presented to
tax authorities must meet professional standards. The penalties for
undervaluation can include accuracy-related penalties of 20 to 40
percent of the tax underpayment.

---

## The Honest Handoff: Communication Standards

When escalation is required, deliver the recommendation with clarity
and without apology. The seller is owed an honest explanation, not
a softened version that obscures the limitation.

Standard escalation language:

"Based on the information available, this item warrants examination by
a qualified specialist before a final valuation is established. The AI
analysis has identified characteristics consistent with [specific
attribution], and comparable sales suggest a range of [low] to [high].
However, [specific reason for escalation — e.g., the mark on the base,
the extent of the restoration, the value range itself] requires
hands-on examination to resolve with confidence. We recommend engaging
an accredited appraiser from the American Society of Appraisers, the
Appraisers Association of America, or a specialist at a major auction
house. The cost of a professional appraisal at this value level is
typically recovered many times over through accurate pricing."

Do not use language that implies the AI failed. The AI performed
correctly. The escalation is the correct output for this item.
Do not hedge or bury the escalation recommendation. Place it first
when it is the primary finding.

---

## AI Disagreement as an Escalation Signal

When the four models disagree at or above the 40 percent threshold
described in Scenario 2, the disagreement pattern itself may provide
diagnostic information. Report which models diverged and on which
specific attributes — not just the price range.

If three models agree and one is an outlier, investigate the outlier's
reasoning before discarding it. Outliers are sometimes correct. A model
that identifies a specific factory mark or period characteristic missed
by the others may have found the true attribution.

If the disagreement is in condition rather than attribution or value,
the escalation trigger is condition-driven. Specify that in the output:
"The models agree on attribution but disagree on condition, which
suggests that the photographs do not provide sufficient visual
information to establish condition grade. Physical examination is
required."

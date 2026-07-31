# marketing specialization

Brand and campaign copy — landing pages, hero headlines, ads, email, push/notification copy, CTAs,
value propositions, social. Here the goal is **transcreation**: preserve the *intent, emotion, and
brand voice*, not the literal words. A word-for-word rendering that loses the punch is a failure,
even if it's "accurate."

## When to use

Persuasive, brand-driven, or conversion-focused copy. Choose this over `general` when the material's
job is to make someone feel something or take an action — not to inform or instruct. If the same
project has both docs and landing pages, run docs under `technical`/`general` and campaign copy under
`marketing`.

## Terminology & non-negotiables (feeds C2)

- **Brand voice is the term of art.** Match the brand's established tone in the target language
  (playful, premium, bold, warm) — from the project's brand/voice guide or existing localized
  campaigns. Consistency of *voice* across strings matters more than consistency of literal wording.
- **Transcreate idioms, wordplay, and cultural references** — find the target-culture equivalent
  that lands, don't calque the source. A pun that doesn't work in the target language should be
  replaced with one that does (or a clean non-pun that keeps the intent), and flagged so a human can
  bless it.
- Keep **taglines and slogans** consistent with any officially-approved localized version; if none
  exists, offer a transcreated option and flag it for sign-off rather than inventing silently.

## Verbatim / do-not-translate (feeds C3)

- **Brand names, product names, trademarks, and official taglines** on the do-not-translate list —
  never translate, transliterate, or decline them.
- Legal/claim qualifiers embedded in marketing copy (`*Terms apply`, `†`, disclaimer footnotes,
  regulated claim language, prices, percentages, dates, guarantee terms) — treat as identity/data;
  do not soften, drop, or embellish. If a claim's wording is regulated, flag rather than rephrase.
- Interpolation tokens and placeholders (`{firstName}`, `{discount}`, `%s`) — name-identical.
- Hashtags, @handles, campaign codes, UTM/tracking params, URLs.

## Framing & register (feeds C6)

- **Impact over literalness.** Reorder, re-length, and rephrase freely to make the target read like
  native campaign copy — as long as the promise, offer, and brand voice are intact.
- Preserve the **call-to-action strength**: a punchy imperative stays punchy; don't dilute "Get
  started free" into "It is possible to begin at no cost."
- Respect the target culture's persuasion norms (formality, humor, directness) — what reads as
  confident in one language reads as pushy in another. Adapt, don't transplant.
- **Never overstate a claim** the source doesn't make, and never weaken a legally-bounded one.
  Transcreation frees the *style*, not the *facts*.

## Escalation triggers (Junior → Senior)

Almost all marketing copy is Senior work — headlines, body, CTAs all carry brand voice. Junior is
limited to trivial non-brand chrome (a cookie "Accept" button, a generic form label). Anything with
a claim, a tagline, wordplay, a price/offer, or a disclaimer → Senior.

## Notes

- Flag every transcreation that departs meaningfully from the literal source so a human can approve
  the creative choice — the Lead surfaces these as open questions rather than silently shipping them.
- Watch character/length limits for ad platforms, subject lines, and buttons; deliver copy that fits
  the medium.
- Localize formats (dates, currency display, phone formats) and imagery-referencing copy to the
  target market.
- Curly quotes are correct and expected *inside* marketing content per language — but if the copy
  lands in a code string (`.ts`/`.json`/`.po`), the outer delimiter must stay straight ASCII.

# Specializations

A **specialization** is a domain profile the translator panel loads at runtime. It tells the
**Senior** translator and the **Lead** reviewer what the correct terminology is for the material,
what must stay verbatim, what framing must be preserved, and when a "chrome" string is actually too
risky for the Junior tier.

It is a **setting**, not a hardcoded domain. Every translation run picks exactly one:

- `/translate --domain <name>` on the invocation, else
- `translation.config.json → "specialization"`, else
- the default: **`general`**.

## Included presets

| Module | Use for |
|---|---|
| `general.md` | The default. Everyday content — product copy, docs, blog posts, generic UI — with no special regulatory or domain constraints. |
| `technical.md` | Software/developer material — UI strings, API docs, README/CLI help, error messages, WordPress theme/plugin strings. Keeps identifiers, code, and markup exact. |
| `marketing.md` | Brand and campaign copy — landing pages, ads, email, CTAs. Transcreation-friendly: prioritizes idiomatic impact and brand voice over literal fidelity. |
| `legal.md` | Legal/compliance copy — the reference example ported from the source project (statute-fee calculator). Citations verbatim, terms of art, "reference not mandatory-minimum" framing. Included as a worked example of a high-constraint domain. |
| `finance.md` | Finance/financial-services copy — banking, investments, insurance, payments, lending, rates & fees, statements, and the regulatory disclosures around them. Money and identifiers verbatim, market terms of art, obligation/risk framing never softened. |
| `medical.md` | Healthcare/life-sciences copy — drug/device information, dosages, clinical and patient-facing content, and regulated safety text. Drug names, dosages, and units verbatim, clinical terms of art, warnings/contraindications never softened, no medical advice implied. |
| `ecommerce.md` | Retail/storefront copy — product listings, cart/checkout, shipping/returns/warranty terms, order emails. SKUs, sizes, and prices verbatim, retail terms of art, CTAs transcreated, policy limits and claims never overstated. |
| `travel.md` | Travel/hospitality copy — reservations, listings, itineraries, tickets, destination content. Times, dates, fares, and codes verbatim, travel-sense disambiguation (Book/Register), fare and cancellation rules never softened. |
| `government.md` | Public-sector copy — services, forms, benefits/eligibility, notices, civic guidance. Official designations and references verbatim, mandated plain language, obligations/rights/deadlines never altered. |
| `scientific.md` | Scientific/academic copy — papers, abstracts, theses, lab/technical docs. Numbers, units, nomenclature, and citations verbatim, standardized terms of art, hedging and certainty preserved exactly. |

## Combining specializations (layering)

A run can load **more than one** module when a surface genuinely spans domains. Pass a comma-list on
the flag (`/translate --domain technical,finance`) or a JSON array in the config
(`"specialization": ["technical", "finance"]`). The rules:

- The **first** module is **primary** — it wins on any direct tone/framing (C6) conflict.
- Every module contributes its **terminology (C2)** and **verbatim/do-not-translate (C3)** rules; those
  lists are unioned across all layers.
- The panel reads the layers as one concatenated brief with a precedence preamble. If two layers give
  conflicting framing that primacy doesn't resolve, the string is treated as high-stakes and flagged.
- Layer **compatible** domains only. Stacking opposites (e.g. `marketing` + `legal`) sends the panel
  contradictory instructions — split those into separate runs over separate scopes instead.

A single module remains the norm; reach for layering only when one surface truly needs two domains at
once.

## Adding your own

Drop a new `specializations/<name>.md` following the shared skeleton (below) and run
`/translate --domain <name>`. No code changes — the skill passes `specializations/<name>.md` to the
panel by path.

A project **glossary** (`translation.config.json → "glossary"`, e.g. a CSV/TSV of
`source,target-lang,term`) overrides the specialization on any term it defines — use it for
project-specific vocabulary without forking a module.

## Module skeleton

Every module has these sections; the panel reads them by heading:

```markdown
# <name> specialization

## When to use
One paragraph: what material this fits.

## Terminology & non-negotiables   (feeds the Lead's C2 check)
The domain's terms of art and how to source them; do-not-guess rules.

## Verbatim / do-not-translate      (feeds C3 identity)
What stays byte-identical: identifiers, citations, code, units, brand-like tokens.

## Framing & register               (feeds C6)
The stance/tone to preserve; the drift traps specific to this domain.

## Escalation triggers              (Junior → Senior)
Words/patterns that mean a "chrome" string is actually domain-critical and must go to Senior.

## Notes
Anything else the translator should know (units, formats, common calques to avoid).
```

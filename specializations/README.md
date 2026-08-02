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
| `banking.md` | Banking/financial-services copy — account/card products, payments, lending, rates & fees, statements, and the regulatory disclosures around them. Money and identifiers verbatim, market terms of art, obligation/risk framing never softened. |

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

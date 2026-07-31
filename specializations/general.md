# general specialization

The **default** profile. Use when the material has no special regulatory, legal, medical, or
heavy-brand constraints — everyday product copy, documentation, blog posts, generic UI, help
content, JSON/`.po` catalogs of ordinary strings.

## When to use

Anything that isn't clearly one of the specialized domains. When in doubt, this is the safe default:
it enforces the universal translation-quality rules (no leftovers, placeholders/markup preserved,
identity tokens verbatim, natural idiomatic tone) without imposing domain vocabulary the material
doesn't need.

## Terminology & non-negotiables (feeds C2)

- No domain-specific term-of-art requirement. Translate for **meaning and natural usage** in the
  target language, matching how a careful native editor of this kind of content would phrase it.
- Keep terminology **consistent within the run** — if a UI concept ("Dashboard", "Workspace",
  "Board") is rendered one way, use that rendering everywhere; don't vary synonyms for the same
  concept. A supplied project glossary wins on any term it defines.
- Don't invent jargon. If a source term is genuinely a proper noun or an established loanword in the
  target language, keep it — but flag rather than guess when unsure.

## Verbatim / do-not-translate (feeds C3)

- Numbers, dates, currencies, percentages, units, measurements.
- Code spans, identifiers, file paths, URLs, email addresses, enum/API values, keyboard shortcuts.
- Brand and product names on the project's do-not-translate list.
- Interpolation tokens and `printf`/ICU placeholders (name-identical; reorder only).

## Framing & register (feeds C6)

- **Match the source's register.** Plain source → plain target; friendly → friendly; formal →
  formal. Don't upgrade casual copy into stiff formality (the classic machine-translation drift) or
  downgrade formal copy into slang.
- Respect target-language conventions for politeness/formality (e.g. formal vs informal "you" —
  pick the register the product already uses and stay consistent).
- Neutral, clear, human. No added marketing fluff, no editorializing, no omissions.

## Escalation triggers (Junior → Senior)

The Junior tier handles pure chrome. Escalate to Senior when a string carries: legal/medical/
financial wording, a citation or identifier, regulated claims, long-form prose (more than a short
label/sentence), or anything the Junior's own STOP-trigger list catches. When unsure, Senior.

## Notes

- Localize formats to the target: number separators, date/time formats, quotation marks
  (German „…“, French « … », etc.) **inside** content — never as code string delimiters.
- Preserve list/heading/table structure and array lengths; translate values, not structure.
- If the source copy itself reads wrong or ambiguous, flag it — don't silently "improve" it in
  translation.

# government specialization

**Government / public-sector** copy — official information and services, forms and applications,
benefits/eligibility and tax content, public notices and regulations, civic and health/safety
guidance, and portal UI. A high-constraint domain with two hard demands at once: **legal accuracy**
(official terms and obligations must be exact) and **plain-language accessibility** (the public must
actually understand it). A mistranslated eligibility rule, deadline, or right can deny someone a
service.

## When to use

The material is an official communication from a public authority: gov service pages, application
forms, benefit/eligibility/tax explanations, public notices, civic guidance, and the portal UI around
them. Choose this over `general` for any government/public-sector surface, over `legal` when the goal
is to *explain* rights and services to the public in plain language (not reproduce statute), and over
`marketing` always — public-sector copy informs, it doesn't sell.

## Terminology & non-negotiables (feeds C2)

- **Use the official designation for institutions, programs, and documents.** Agency/ministry names,
  benefit and scheme names, form IDs/titles, and official document names take their established target-
  language designation where the authority publishes one; otherwise keep the source name and gloss it.
  Never invent or casually translate an official name.
- **Match the register mandate: plain language.** Many governments require plain-language public
  communication — prefer the clear, common word over bureaucratic jargon, keep sentences direct, and
  don't "elevate" the source into officialese. Where the source is deliberately technical (a
  regulation), keep it technical.
- **Distinguish terms that collapse in translation.** "Eligible" vs "entitled" vs "qualified";
  "apply" vs "register" vs "enrol"; "resident" vs "citizen" vs "national"; "may" (permission) vs
  "must"/"shall" (obligation); "appeal" vs "complaint" vs "review"; "fee" vs "fine" vs "tax".
- **Research wording in the target market's own official sources** — the government's own
  target-language publications are authoritative. Where a jurisdiction has an official minority-language
  standard, follow it. Flag anything you can't confirm for human review.

## Verbatim / do-not-translate (feeds C3)

- **Legal and reference identifiers stay exact**: statute/regulation numbers, article/section
  references, form numbers, case/reference/application IDs, and official codes — the same way `legal`
  treats citations.
- **Numbers that carry rights are identity.** Amounts, rates, thresholds, deadlines, dates, and ages
  (benefit amounts, income limits, filing dates, eligibility ages) keep their exact value; localize
  number/date *format* for display only, never the value.
- **Official names and designations** (institutions, programs, titles) stay as the authority defines
  them (see the project do-not-translate list / glossary).
- **Placeholders & markup**: `{amount}`, `{date}`, `%s`, ICU plurals, and form-field tokens stay
  name-identical; only surrounding prose translates.

## Framing & register (feeds C6)

- **Never soften or strengthen an obligation, right, or condition.** Keep the exact modality —
  "must"/"shall" vs "may" vs "should", "required" vs "recommended", "you are entitled to" vs "you may
  apply" — in every language. Misstating obligation vs permission changes what the reader must do.
- **Preserve deadlines, conditions, and consequences in full.** Filing dates, eligibility conditions,
  and "if you do not… then…" consequences are actionable — translate faithfully and completely, never
  abbreviate or drop a condition.
- **Neutral, official, inclusive, and accessible.** No promotional tone, no added reassurance or
  alarm; use inclusive, non-discriminatory phrasing and the accessible register the source intends.
  Apply the run's formality setting for how the authority addresses the citizen (formal vs plain "you").

## Escalation triggers (Junior → Senior)

Junior may translate pure portal chrome (nav, generic buttons, footer, a language switcher). Escalate
to Senior on any: eligibility, entitlement, or obligation wording; benefit/tax amount, rate, threshold,
or deadline; official institution/program/form name; rights, appeal, or complaint text; legal/statute
reference; or any application, notice, or civic-guidance prose.

## Notes

- **Localize number and date formats** for display, but **never** change an amount, a rate, a
  threshold, a deadline, or a reference number's value.
- Keep parallel structured copy in sync: an eligibility list, its form fields, and any FAQ must match
  per language in count and meaning; conditions and consequences stay parallel.
- Follow the jurisdiction's official terminology and any regulated accessibility/plain-language
  standard; where an official target-language version of a term exists, it wins over a glossary guess.
- When the source itself looks wrong (an amount that contradicts the prose, a deadline that mismatches
  a rule), flag it to the user — never silently "correct" a figure or a rule in translation.

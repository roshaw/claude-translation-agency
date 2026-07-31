# legal specialization

Legal and compliance copy — statutes, regulations, terms of service, disclaimers, legal-fee /
tariff material, court and procedural content, privacy notices. This is the **reference example**,
distilled from the source project this system was extracted from (a legal-fee calculator). It shows
what a high-constraint domain module looks like: here a mistranslation isn't just awkward, it can be
*wrong* in a way that misleads about legal rights.

## When to use

The material makes or describes statements about the law, legal rights, obligations, fees, or
regulated claims. Choose this whenever citations, statutes, terms of art, or legal framing appear.
When unsure whether copy is "legal enough," use this — false caution is cheaper than a wrong legal
term shipping.

## Terminology & non-negotiables (feeds C2)

- **Use the jurisdiction's real term of art**, never a literal calque. A "court fee" / "state fee"
  has a specific native term in each legal system (e.g. cs `soudní poplatek`, pl `opłata sądowa`,
  ro `taxă judiciară de timbru`) — use it, don't word-for-word translate the English.
- **Research terminology in the target language** before committing — a native-language legal source
  is authoritative; an English summary is not. A confident wrong term is worse than a brief lookup.
  When the glossary and a source disagree, the jurisdiction's own statute wording wins.
- Never invent legal vocabulary. If you can't confirm the term of art, flag it for human review
  rather than guessing.

## Verbatim / do-not-translate (feeds C3)

- **Article references, statute citations, and ordinance names stay byte-identical in the source
  language across every locale** — `§ 11 odst. 1`, `art. 7 ust. 1 pkt 1`, `art. 3 alin. (1) lit. a`,
  `чл. 7, ал. 2`, named acts and gazette references. They are identity: the reader clicks through to
  that exact provision. Translating "Чл. 2" to "Art. 2" breaks the link and is always wrong.
- Numbers, fee amounts, currency codes, dates, effective/revision stamps — data, never altered.
- Inside markup, citation contents (`<ArtRef>…</ArtRef>`, `<code>…</code>`) are verbatim; only the
  surrounding prose translates.

## Framing & register (feeds C6)

- **Reference vs. binding — the signature trap.** If the source frames a value as *indicative /
  reference* (e.g. a fee schedule that is no longer a mandatory minimum), every language must keep
  that framing — never let it drift into "minimum" / "mandatory" / "binding" / "floor" (or the
  native equivalents: `минимална`, `minimalna`, `minimální`, `minimă`). The reverse is equally
  wrong: where a source *is* a binding minimum, don't soften it. Preserve the exact legal status.
- **Never imply legal advice.** Copy describes what the law/tariff says; it is not counsel. Avoid
  imperative or advisory phrasing ("you must…", "we recommend…") in any language unless the source
  is explicitly that.
- Neutral, precise, public-service register — closer to a bar council's public information page than
  a law firm's marketing. No legalese padding, no reassurance the source doesn't give.

## Escalation triggers (Junior → Senior)

Essentially all legal prose is Senior. Junior may only touch pure non-legal chrome (nav, a generic
button). Any citation, statute name, fee/amount, disclaimer, "reference/binding/minimum/mandatory/
fee/tariff/liability/jurisdiction" wording, or FAQ/about legal body → Senior.

## Notes

- Keep parallel structured copy in sync: a visible FAQ and its FAQ JSON-LD must match per language;
  disclaimer arrays stay parallel in length and meaning.
- Localize number formats (decimal/group) but **never** reformat numbers *inside* a citation.
- Brand/product names stay untouched (see the project do-not-translate list).
- When the source itself looks legally wrong, flag it to the user — never silently "correct" the law
  in translation.

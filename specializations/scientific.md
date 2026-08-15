# scientific specialization

**Scientific / academic** copy — research papers and abstracts, journal and conference material,
theses and textbooks, technical/lab documentation, grant and study content, and the citations, units,
and nomenclature throughout. A high-precision domain: terminology is standardized and often
international, numbers and units are data, and a mistranslated term, unit, or citation misstates a
result or breaks scholarly attribution.

## When to use

The material reports, teaches, or documents research: papers, abstracts, reviews, theses, textbooks,
lab/methods documentation, datasets and figure captions, and grant/study text. Choose this over
`general` for scholarly or technical-scientific writing, over `technical` when the content is *science*
rather than software, and over `marketing` always. For clinical/patient-facing health material use
`medical`; for the binding grant contract or ethics agreement, `legal` may fit.

## Terminology & non-negotiables (feeds C2)

- **Use the field's standardized term of art**, never a literal calque or an invented equivalent.
  Scientific vocabulary is largely internationalized — many terms have one settled target-language form
  (or are kept in the international form). Use the discipline's accepted term; do not paraphrase a
  technical concept into everyday language.
- **Nomenclature follows its naming system, not translation.** Taxonomic (Latin binomial) names,
  chemical (IUPAC) names and formulae, gene/protein symbols, SI unit names, and mathematical notation
  follow their international standard and are not "translated" — reproduce them exactly, adjusting only
  where the target language has an official standardized rendering.
- **Distinguish terms that collapse in translation.** "Accuracy" vs "precision"; "significant"
  (statistical) vs "important"; "theory" vs "hypothesis"; "weight" vs "mass"; "concentration" vs
  "amount"; "correlation" vs "causation"; "sample" vs "specimen" vs "population". Getting these wrong
  changes the scientific claim.
- **Research terminology in the target language's own scholarly sources** (peer-reviewed literature,
  standards bodies, discipline glossaries) before committing; flag low-confidence terms for human
  review rather than guessing.

## Verbatim / do-not-translate (feeds C3)

- **Numbers, units, and measurements are identity.** Values, SI units and symbols (m, kg, s, mol, K,
  Pa), quantities, statistics (p-values, CIs, n), and error terms stay byte-identical — never convert a
  unit, round, or alter a digit or exponent. Localize the decimal marker only where the source is
  clearly a display value, never inside data, a table, or an equation.
- **Citations and identifiers stay exact**: reference lists, in-text citations, DOIs, PubMed/arXiv IDs,
  ISBN/ISSN, dataset and accession numbers, equation/figure/table numbers, and grant IDs — treat like
  `legal` statute citations. Do not translate authors' names or journal titles.
- **Notation, formulae, code, and symbols** (mathematical expressions, chemical formulae, variable
  names, algorithms) stay verbatim; only the surrounding prose translates.
- **Placeholders & markup**: `{value}`, `%s`, ICU plurals, LaTeX/MathML, and tags stay name-identical;
  only prose translates.

## Framing & register (feeds C6)

- **Preserve hedging and certainty exactly.** Scientific claims are calibrated — keep "suggests" vs
  "demonstrates", "may" vs "does", "associated with" vs "causes", "significant" vs "significant at
  p<0.05" — in every language. Never strengthen a tentative claim or weaken a firm one.
- **Keep the scholarly register and structure.** Formal, precise, impersonal academic tone; preserve
  the source's structure (IMRaD sections, abstract conventions, defined terms) and any discipline
  house-style the source follows. No simplification or embellishment.
- **Attribution and framing are load-bearing.** Keep who claimed what, and the distinction between the
  authors' findings, cited prior work, and limitations — never blur them in translation.

## Escalation triggers (Junior → Senior)

Junior may translate pure interface chrome (nav, generic buttons, footer, a language switcher).
Essentially all scholarly prose is Senior. Escalate on any: technical term, nomenclature, or formula;
number, unit, statistic, or measurement; citation, DOI, or reference; hedged/quantified claim; methods,
results, or figure/table caption; or abstract/thesis/textbook prose.

## Notes

- **Never convert units or numbers**, even to the target market's conventional unit — a conversion is a
  factual change to a reported value. Localize only the decimal marker, and only for clear display
  values.
- Keep parallel structured copy in sync: an abstract, its figure captions, and any dataset/metadata
  must match per language in every value, unit, and term.
- Author names, journal/venue titles, dataset names, and standardized nomenclature stay untouched (see
  the project do-not-translate list / glossary).
- When the source itself looks wrong (a unit that contradicts the value, a statistic that mismatches the
  text), flag it to the user — never silently "correct" a number or a claim in translation.

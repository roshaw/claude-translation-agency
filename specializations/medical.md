# medical specialization

**Healthcare / life-sciences** copy — drug and medical-device information, dosage and administration
instructions, patient-facing content (leaflets, consent forms, symptom/condition explainers), clinical
and professional material (guidelines, trial documentation, EHR/health-app UI), and the regulated
safety text around all of it (warnings, contraindications, side effects, package inserts). A
high-constraint, safety-critical domain: a mistranslated dose, unit, drug name, or warning isn't just
awkward — it can cause direct physical harm.

## When to use

The material describes health, a treatment, or a medical product: drug/device names and instructions,
dosages and administration, symptoms/diagnoses/procedures, clinical or trial content, or the
safety/regulatory language around them (indications, contraindications, side effects, warnings,
informed-consent and patient-information text). Choose this over `general` or `marketing` whenever
clinical terminology, dosing, or patient-safety framing appears. When unsure whether copy is "medical
enough," use this — a wrong clinical term shipping is far more expensive than a brief lookup.

## Terminology & non-negotiables (feeds C2)

- **Use the established clinical/medical term of art**, never a literal calque or a lay paraphrase where
  the source is technical. Anatomy, conditions, procedures, and pharmacological terms each have a
  settled designation in the target language's medical register — use it. Match the source's register:
  keep patient-facing plain language plain, and professional/clinical language technical; don't
  "upgrade" a lay leaflet into jargon or "dumb down" a clinical guideline.
- **Drug names follow the naming system, not translation.** International Nonproprietary Names (INN /
  generic names) take their official local INN form; **brand/trade names stay as registered** and are
  not translated or transliterated. Never swap a brand name for the generic (or vice versa) — they are
  not interchangeable.
- **Distinguish terms that collapse in translation.** "Dose" vs "dosage"; "adverse event" vs "side
  effect"; "contraindication" vs "precaution" vs "warning"; "indication" vs "usage"; "acute" vs
  "chronic"; "efficacy" vs "effectiveness"; route of administration ("oral", "topical",
  "subcutaneous", "intravenous"). Getting these wrong changes clinical meaning.
- **Research terminology in the target market's own medical sources** before committing — a
  native-language regulator (medicines agency), pharmacopoeia, or professional body is authoritative;
  an English gloss is not. When the glossary and a source disagree, the market's own
  regulatory/clinical wording wins. If you can't confirm a term of art, flag it for human review
  rather than guessing — do not approximate clinical vocabulary.

## Verbatim / do-not-translate (feeds C3)

- **Dosage is identity.** Numeric doses, strengths, frequencies, and durations (`500 mg`, `2×/day`,
  `for 7 days`) and their **units** (mg, µg, mL, IU, mmol/L, mg/kg) stay byte-identical — never alter a
  digit, convert a unit, or change a decimal separator inside a dose. Do not "helpfully" convert units
  or round; a converted dose is a wrong dose.
- **Clinical identifiers and codes stay exact**: ICD-10/11, SNOMED CT, ATC, LOINC codes; trial
  registration numbers (e.g. NCT / EudraCT); batch/lot numbers; MedDRA terms where cited as codes.
  These are keys, not prose.
- **Regulatory references** stay in source form when they point to a specific provision, monograph, or
  notice (directive/regulation numbers, SmPC/package-insert section references), the same way `legal`
  treats statute citations.
- **Placeholders & markup**: `{dose}`, `%s`, `{0,number}`, ICU plurals, and any tags stay
  name-identical; only surrounding prose translates. Unit/number ICU skeletons are not translated.

## Framing & register (feeds C6)

- **Never soften or strengthen a warning, contraindication, or risk.** If the source says a drug "must
  not" be used, an effect "may" occur, a step is "required", or a symptom needs "immediate" attention,
  every language keeps that exact modality — don't drift "must not" into "should not", "may" into
  "will", or a serious warning into reassurance. The reverse is equally wrong.
- **Preserve mandatory safety and consent language.** Contraindications, boxed/black-triangle warnings,
  side-effect lists, storage instructions, and informed-consent wording are regulated in content and
  completeness — translate them faithfully and in full, never abbreviate, reorder by severity, or omit.
- **Never imply medical advice or a diagnosis.** Copy describes products, conditions, and instructions;
  it is not a recommendation to take an action or a personalized diagnosis. Avoid inserting advisory or
  imperative phrasing the source doesn't have ("you should take…", "this will cure…") in any language.
- Neutral, precise, clinically accurate register — official product/patient-information language, not
  marketing or false reassurance. No added urgency or comfort the source doesn't give. (For pure
  promotional health-product copy, `marketing` may fit; for consent contracts/statutes, `legal` may.)

## Escalation triggers (Junior → Senior)

Essentially all clinical prose is Senior. Junior may only touch pure non-clinical chrome (nav, a
generic button, a language-switcher entry). Escalate to Senior on any: drug/device name; dose,
strength, unit, frequency, or route; symptom, condition, diagnosis, or procedure name; contraindication,
warning, side-effect, or precaution wording; dosage/administration instruction; consent, eligibility,
or patient-safety text; or any leaflet / SmPC / FAQ / about-the-treatment content.

## Notes

- **Never convert units or numbers.** Do not switch mg↔g, mL↔teaspoon, °C↔°F, or kg↔lb inside clinical
  text, even if the target market conventionally uses another unit — a conversion is a factual change to
  a dose. If a display value clearly wants localized number formatting, localize separators only, never
  the magnitude.
- Keep parallel structured copy in sync: a side-effects list, its schema/JSON, and any patient FAQ must
  match per language in count and meaning; warning arrays stay parallel in length and content.
- Brand, product, and study names stay untouched (see the project do-not-translate list / glossary).
- When the source itself looks clinically or numerically wrong (a dose that contradicts the prose, a
  contraindication that mismatches the indication), flag it to the user — never silently "correct" a
  figure or a clinical statement in translation.

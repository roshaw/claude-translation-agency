# technical specialization

Software and developer-facing material — application UI strings, API and SDK documentation,
README/CLI help, error and log messages, developer guides, and **WordPress theme/plugin** strings
(gettext `.po`/`.pot`, WP JSON). Precision about identifiers and markup matters more than stylistic
flourish.

## When to use

The material is a software product or its documentation: message catalogs, `.po`/`.pot`, i18next/
`.arb` JSON, MDX/HTML docs with code, WordPress translation files, error strings. Choose this over
`general` whenever code, APIs, or CLI/UI element names appear in the copy.

## Terminology & non-negotiables (feeds C2)

- Use the **established localized term** for standard UI/computing concepts in the target language
  (e.g. "settings", "sign in", "cache", "deploy", "commit") — follow the platform's own convention
  where one exists (Microsoft/Apple/GNOME language style guides, or the project glossary). Don't
  coin new terms for concepts that already have a settled translation.
- **Keep product-specific and API terms exact.** Names of features, endpoints, classes, methods,
  config keys, CLI flags, and error codes are identifiers, not prose — keep them in the source form
  (see Verbatim). Translate the *description around* them, not the token.
- Consistency is a hard requirement: the same UI element or concept must read identically everywhere
  in the run (a "Button" is not sometimes "Schaltfläche" and sometimes "Knopf").

## Verbatim / do-not-translate (feeds C3)

- **Code**: anything in `` `backticks` ``, `<code>`, fenced blocks, inline snippets — identifiers,
  keywords, syntax. Never translate code, comments-inside-code, or example output.
- **Identifiers**: function/class/variable names, config keys, env-var names, CLI flags (`--force`),
  file paths, package names, URLs, HTTP methods/status codes, MIME types, enum values, error codes.
- **Placeholders**: `%s`, `%d`, `%1$s`, `{count}`, `{{var}}`, `:id`, `${x}`, ICU `{n, plural, …}` —
  name-identical; reorder only. `printf` positional args (`%1$s`, `%2$s`) exist so you *can* reorder
  for grammar — use them, don't drop the position.
- **Markup**: HTML/JSX tags and their structural attributes (`href`, `id`, `class`, component prop
  keys), Markdown/MDX structure. Translate visible attribute text (`title`, `alt`, `aria-label`,
  `placeholder`) and tag bodies only.
- Keyboard shortcuts and key names, version numbers, and units (`ms`, `KB`, `px`).

## Framing & register (feeds C6)

- **Neutral, precise, instructional.** Match the register of good developer docs — concise, direct,
  no marketing tone. Imperatives for instructions ("Run the command", not "You might want to run…").
- Error/log messages: keep them terse and accurate; don't soften a hard failure into a suggestion.
- Don't over-translate: if the source project's convention is to keep certain English technical
  terms untranslated (common in many locales), follow the project glossary / existing translations
  rather than forcing a calque.

## Escalation triggers (Junior → Senior)

Junior may do pure UI chrome (nav, buttons, generic errors). Escalate to Senior when a string has:
any code/identifier, a `printf`/ICU placeholder that interpolates a technical concept, an API/CLI
term, a multi-sentence description, markup beyond simple inline, or a plural entry needing per-
language `msgstr[n]` forms.

## Notes

- **WordPress**: translate the `.po` (fill `msgstr`, every plural `msgstr[n]`); keep `msgctxt` and
  `#:` source-reference comments; set the header `Language:`/`Plural-Forms:`. Let the pipeline
  compile `.mo` and regenerate the WP JSON from the `.po` — don't hand-edit `.mo`.
- **Plural-Forms** differ by language (English 2, Japanese/Chinese 1, Polish 3, Arabic 6). Fill every
  index the target language requires; a blank `msgstr[n]` renders empty.
- Watch **string delimiters**: pasted translations often carry curly quotes that break the build in
  `.ts`/`.js`/`.json` — straight ASCII delimiters only; typographic quotes belong inside content.
- Respect string length where UI space is constrained (buttons, menus) — prefer the shorter natural
  rendering.

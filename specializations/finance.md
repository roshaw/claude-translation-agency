# finance specialization

**Finance / financial-services** copy across the whole sector — retail/commercial/investment
**banking** (accounts and cards, payments and transfers, lending and mortgages, statements and
disclosures, online/mobile banking UI), **investments and markets** (brokerage, funds, trading,
portfolios), **insurance** (policies, premiums, claims, cover terms), **corporate/personal finance**
(accounting, tax, payroll, budgeting), and **fintech/crypto** (wallets, exchanges, tokens) — plus the
KYC/AML and regulatory notices, fees, and rates around all of them. A high-constraint domain: a
mistranslated rate, fee, or regulatory term isn't just awkward — it can misstate a financial
obligation, a legal disclosure, or a regulated product feature.

## When to use

The material describes or transacts money: bank/card products, investments and trading, insurance
cover, payments, loans, interest rates and fees, balances and statements, or the compliance/disclosure
language around them (terms & conditions, risk warnings, KYC/AML, deposit-guarantee notices). Choose
this over `general` or `legal` whenever financial products, rates/fees, or financial-regulatory framing
appear. When unsure whether copy is "financial enough," use this — a wrong financial term shipping is
more expensive than a brief lookup.

## Terminology & non-negotiables (feeds C2)

- **Use the market's real financial term of art**, never a literal calque. Concepts like "current /
  checking account", "overdraft", "APR / APRC", "wire transfer", "direct debit", "standing order",
  "IBAN", "clearing", "settlement", "collateral", "escrow" each have a settled native banking term in
  each market — use it, don't word-for-word translate the English.
- **Distinguish terms that collapse in translation.** "Interest" (the sum) vs "interest rate"; "fee"
  vs "charge" vs "commission"; "balance" vs "available balance"; "credit" (verb: to add funds) vs
  "credit" (a loan facility); "principal" vs "interest"; "debit / credit" in the accounting sense.
  Getting these wrong changes the meaning of a statement or contract line.
- **Regulated names stay as the regulator/product defines them.** Statutory product names (e.g. an
  ISA, a Riester pension, a Livret A, a PEA), regulator names, and scheme names take their official
  local designation — never invent or literally translate them.
- **Research terminology in the target market's own financial sources** before committing — a
  native-language bank, central-bank, or regulator page is authoritative; an English gloss is not.
  When the glossary and a source disagree, the market's own regulatory/industry wording wins. If you
  can't confirm a term of art, flag it for human review rather than guessing.

## Verbatim / do-not-translate (feeds C3)

- **Money is identity.** Amounts, interest rates, APR/APRC/EAR percentages, fees, exchange rates, and
  currency codes (ISO 4217: `EUR`, `USD`, `GBP`) stay byte-identical — never alter a digit, a
  percentage, or a currency. Localize decimal/grouping separators only where the source clearly
  presents a display number, never inside a rate table, contract clause, or code.
- **Financial identifiers stay exact**: IBAN, BIC/SWIFT, account and card numbers, sort codes/routing
  numbers, ISIN/CUSIP/SEDOL, reference/transaction IDs, LEI. These are keys, not prose.
- **Regulatory citations and disclosure references** stay in the source form when they point to a
  specific provision or notice (directive/regulation numbers, article references, scheme identifiers),
  the same way `legal` treats statute citations.
- **Placeholders & markup**: `{amount}`, `%s`, `{0,number,currency}`, ICU plurals, and any tags stay
  name-identical; only surrounding prose translates. Currency/number ICU skeletons are not translated.

## Framing & register (feeds C6)

- **Never soften or strengthen a financial obligation or risk.** If the source says a fee "may apply",
  a rate "is variable", or capital "is at risk", every language must keep that exact modality — don't
  drift "may" into "will", "variable" into "fixed", "up to X%" into "X%", or a risk warning into
  reassurance. The reverse is equally wrong.
- **Preserve mandatory disclosure language.** Risk warnings, representative-example wording,
  deposit-guarantee statements, and "your home may be repossessed"-style notices are regulated in
  content and prominence — translate them faithfully and completely, never abbreviate or omit.
- **Never imply financial or investment advice.** Copy describes products and terms; it is not a
  recommendation. Avoid advisory/imperative phrasing ("you should invest…", "we recommend this
  account") in any language unless the source is explicitly that.
- Neutral, precise, trustworthy register — a bank's official product and statement language, not
  marketing hype. No added reassurance, no urgency the source doesn't give. (For pure promotional
  campaign copy, `marketing` may fit better; for statute/contract text, `legal` may.)

## Escalation triggers (Junior → Senior)

Essentially all financial prose is Senior. Junior may only touch pure non-financial chrome (nav, a
generic button, a language-switcher entry). Escalate to Senior on any: amount, rate, fee, currency;
account/card/product name; IBAN/BIC or other identifier; interest/APR/overdraft/loan/mortgage/
deposit/transfer/statement/balance wording; risk warning, disclosure, or KYC/AML text; or any
FAQ/T&C/about-the-product content.

## Notes

- **Localize number and currency formats** (decimal/group separators, currency symbol position,
  negative-amount convention) to the target market — but **never** reformat numbers *inside* a rate
  table, contract clause, citation, or code, and never change the currency itself.
- Keep parallel structured copy in sync: a fees table, its schema/JSON, and any FAQ must match per
  language in both numbers and meaning; disclosure arrays stay parallel in length and content.
- Brand/product and scheme names stay untouched (see the project do-not-translate list / glossary).
- When the source itself looks financially or numerically wrong (a rate that contradicts the prose, a
  mismatched total), flag it to the user — never silently "correct" a figure in translation.

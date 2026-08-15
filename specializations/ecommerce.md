# ecommerce specialization

**E-commerce / retail** copy — product listings and descriptions, category and collection pages,
cart/checkout and payment UI, shipping/returns/warranty terms, order and account emails, reviews, and
the promotional and SEO surface around them. Conversion matters, but so does accuracy: a mistranslated
size, material, return window, or shipping term costs sales *and* generates support tickets and
returns.

## When to use

The material sells or describes a product for purchase, or runs the buying flow: product/category
pages, cart/checkout, order confirmations, shipping and returns policy, product attributes (size,
colour, material, compatibility), and store-side marketing (banners, promo copy, product SEO). Choose
this over `general` for a storefront, and over pure `marketing` when the copy carries product facts and
transactional terms — not just brand persuasion.

## Terminology & non-negotiables (feeds C2)

- **Use the market's real retail term of art**, never a literal calque — "cart"/"basket", "checkout",
  "add to bag", "wishlist", "in stock"/"back-order", "free returns", "size guide", "out for delivery"
  each have a settled native retail phrasing. Match the store's tone (see framing).
- **Product attributes are facts, not prose.** Sizes, dimensions, weights, materials/fabric,
  compatibility, and care instructions must translate to the *same* meaning — never approximate a
  material ("leather" ≠ "leatherette") or a fit, and localize size systems only when you can map them
  exactly (EU/UK/US), otherwise keep the source scale and flag.
- **Distinguish terms that collapse in translation.** "Order" (noun) vs "to order"; "shipping" (the
  service) vs "shipping" (the cost) vs "delivery"; "refund" vs "return" vs "exchange"; "discount" vs
  "voucher" vs "coupon" vs "promo code"; "in stock" vs "available".
- **Research retail wording in the target market's own major stores** before committing — native
  storefront and consumer-protection wording is authoritative. Flag low-confidence conversion terms for
  human review rather than guessing.

## Verbatim / do-not-translate (feeds C3)

- **SKUs, model numbers, GTIN/EAN/UPC/ISBN, size/variant tokens** (`42`, `XL`, `128GB`, `42x2`) stay
  byte-identical — these are keys and product data, not copy.
- **Prices, currencies, discount percentages, and dimensions** keep their numeric value; localize the
  currency symbol/separator format for display only, never change the amount or the currency.
- **Brand, product, and collection names** stay as registered (see the project do-not-translate list /
  glossary); do not translate or transliterate them.
- **Placeholders & markup**: `{count}`, `%s`, `{0,number,currency}`, ICU plurals, tags, and
  merge-fields in transactional emails stay name-identical; only surrounding prose translates.

## Framing & register (feeds C6)

- **Match the store's voice, and transcreate CTAs.** Buttons and promos ("Shop now", "Only 3 left",
  "Free shipping over X") should read natively and persuasively, not word-for-word — but never invent
  urgency, scarcity, or a discount the source doesn't state.
- **Never overstate a claim or soften a policy limit.** Warranty length, return window, eligibility,
  and delivery estimates keep the source's exact terms and modality ("up to", "within X days",
  "excludes") — these are commitments, and consumer-protection law reads them literally.
- **Keep legal/transactional microcopy precise.** Checkout consent, tax/VAT lines, and
  cancellation-right notices are regulated in many markets — translate faithfully, never abbreviate.
  (For the binding T&Cs themselves, `legal` may fit better; for pure brand campaigns, `marketing`.)

## Escalation triggers (Junior → Senior)

Junior may translate pure store chrome (nav, generic buttons, footer, a language switcher). Escalate to
Senior on any: product description or attribute; price, discount, tax, or shipping term; return,
refund, warranty, or eligibility wording; checkout/consent/legal microcopy; promotional claim, scarcity
or urgency line; or SEO-bearing title/meta copy.

## Notes

- **Localize number, currency, and date formats** for display, but **never** change a price, a size
  token, a SKU, or a dimension's value.
- Keep parallel structured copy in sync: a product's title, attributes table, and its schema/JSON feed
  (and any rich-result/SEO metadata) must match per language in both values and meaning.
- Preserve the source's keyword intent in titles/meta for SEO — translate for the target market's
  search terms, not a literal gloss, but never keyword-stuff beyond what the source does.
- When the source itself looks wrong (a price that contradicts the copy, a size that mismatches the
  chart), flag it to the user — never silently "fix" product data in translation.

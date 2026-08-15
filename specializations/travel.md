# travel specialization

**Travel / hospitality** copy — booking and reservation flows, hotel/flight/rental listings,
itineraries and confirmations, destination and point-of-interest content, tickets and boarding
documents, and the fare/cancellation/policy terms around them. A sense-heavy domain: the same English
word means different things here ("Book" = *reserve*, "Register" = *check in*), and a mistranslated
date, time, policy, or place name strands a traveller.

## When to use

The material books, describes, or documents travel: reservation UI, property/flight/tour listings,
itineraries and e-tickets, destination guides and POIs, and the fare rules, cancellation policies, and
check-in/baggage terms around them. Choose this over `general` for any booking or hospitality surface,
and over pure `marketing` when the copy carries booking facts (times, policies, fares) rather than only
destination persuasion.

## Terminology & non-negotiables (feeds C2)

- **Disambiguate travel senses first.** "Book" = reserve (not the object); "Register"/"Check in" =
  arrival, not sign-up; "single/double/twin" = room/occupancy types; "return/round-trip" vs "one-way";
  "connection" vs "layover"; "board" (a flight) vs "board" (basis, as in half-board). The product
  context decides — use the settled native travel term, never a literal calque.
- **Place, POI, and carrier names follow local convention.** Use the target language's established
  exonym where one exists (its usual name for the city/country), keep officially-branded names
  (airlines, hotel brands, station/airport names) as-is, and never invent a translation for a place
  that has a fixed local form. Flag anything you can't confirm.
- **Distinguish terms that collapse in translation.** "Fare" vs "fee" vs "rate" vs "price"; "booking"
  vs "reservation" vs "ticket"; "cancel" vs "change/rebook" vs "refund"; "guest" vs "passenger" vs
  "traveller"; "non-refundable" vs "flexible".
- **Research wording in the target market's own travel sources** (major OTAs, carriers, tourism
  boards) before committing; flag low-confidence terms for human review.

## Verbatim / do-not-translate (feeds C3)

- **Times, dates, and durations are identity.** Departure/arrival times, check-in/out times, dates, and
  durations keep their exact value; localize *format* (24h/12h, date order) for display only, and
  **never** shift a value or drop a time zone. Preserve airport/station codes (IATA `LHR`, `JFK`) and
  the time zone exactly.
- **Booking identifiers stay exact**: confirmation/PNR codes, ticket and flight numbers, room/rate
  codes, loyalty numbers, coordinates. These are keys, not prose.
- **Prices, fares, taxes, and fees** keep their numeric value and currency; localize display format
  only, never the amount or currency.
- **Placeholders & markup**: `{city}`, `{date}`, `%s`, ICU plurals, and merge-fields in confirmation
  emails/e-tickets stay name-identical; only surrounding prose translates.

## Framing & register (feeds C6)

- **Transcreate destination/marketing copy, but never the rules.** Inspirational descriptions should
  read natively and evocatively; fare conditions, cancellation/change policies, baggage allowances, and
  visa/entry notes keep the source's exact terms and modality ("non-refundable", "up to", "subject
  to") — these are commitments and, for entry/visa text, safety-relevant.
- **Never soften or overstate a policy or a claim.** Don't drift "non-refundable" into "refundable",
  "may apply" into "included", or an advisory into a guarantee. The reverse is equally wrong.
- **Register follows the property tier and audience** — a luxury hotel, a budget carrier, and a
  backpacker guide have different voices; keep the source's, and apply the run's formality setting for
  the traveller-facing address (guest vs casual).

## Escalation triggers (Junior → Senior)

Junior may translate pure booking-UI chrome (nav, generic buttons, footer, a language switcher).
Escalate to Senior on any: fare, rate, tax, or fee; cancellation/change/refund policy; baggage,
check-in, boarding, or visa/entry wording; date/time/duration-bearing itinerary text; place/POI/carrier
name; or any destination description or property listing prose.

## Notes

- **Localize date/time/number formats** for display, but **never** change a time, a date, a fare, or a
  code's value, and always preserve the time zone.
- Keep parallel structured copy in sync: an itinerary, its confirmation email, and the underlying
  booking JSON must match per language in every time, date, and policy.
- Brand, property, carrier, and loyalty-program names stay untouched (see the project do-not-translate
  list / glossary).
- When the source itself looks wrong (an arrival before departure, a policy that contradicts the fare),
  flag it to the user — never silently "fix" booking data in translation.

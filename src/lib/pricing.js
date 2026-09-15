/**
 * What a school pays. The only place that answers that question.
 *
 * There used to be three answers and they disagreed. The public page quoted
 * €20.99 / €16.99 / €13.99 per student per year; the Stripe price IDs were
 * configured at €24 / €20 / €16 — 14% more than the site promised; and the
 * super-admin revenue screen calculated from flat monthly figures of
 * €99 / €299 / €799 that no school was ever offered, which made the "estimated
 * MRR" on that page a number derived from fiction.
 *
 * ── The model ────────────────────────────────────────────────────────────
 *
 * One product. No plans, no tiers to choose between, no modules to buy. A
 * school pays for the students it has, and the rate falls as it grows.
 *
 * The bands are GRADUATED — each rate applies only to the students inside its
 * band, the way tax brackets work. The old scheme applied one rate to the
 * whole roll and dropped that rate at each threshold, so crossing a threshold
 * cut the entire bill: a school going from 200 to 201 students paid €783 LESS
 * than before, and one at 601 paid €1,786 less than at 600. A school that
 * recruits a child should not get cheaper. Graduated bands are monotonic by
 * construction — the largest possible jump from one more student is €22.
 *
 * The floor exists because an 80-pupil school at €22 a head pays €1,760, which
 * does not cover onboarding, let alone a year of support. It is deliberately
 * low rather than protective: schools too small for iSAMS are the ones who say
 * yes first, and €200 a month is a number they can sign without a board paper.
 *
 * ── The year ─────────────────────────────────────────────────────────────
 *
 * Billing follows the academic year, 1 August to 31 July, invoiced in advance.
 * A school signing mid-year pays for the months remaining. Schools cannot
 * spend next year's budget this year, and a full-year charge in March is the
 * most common reason a decision slides to September.
 */

/** Graduated bands. `upTo: null` is the final, open-ended band. */
export const BANDS = [
  { upTo: 200, rate: 22 },
  { upTo: 600, rate: 17 },
  { upTo: null, rate: 13 },
];

/** No school pays less than this in a year, however small. */
export const ANNUAL_FLOOR = 2400;

/**
 * Above this roll the answer is a conversation, because hosting and the
 * support model genuinely change — not as a sales tactic.
 */
export const TALK_TO_US_ABOVE = 1500;

export const CURRENCY = 'EUR';
export const ACADEMIC_YEAR_ENDS_MONTH = 7; // July, zero-indexed

/** What a roll of `students` costs for a full academic year, in whole euro. */
export function annualCost(students) {
  const n = Math.max(0, Math.floor(students || 0));
  let total = 0;
  let counted = 0;

  for (const { upTo, rate } of BANDS) {
    const ceiling = upTo === null ? n : Math.min(n, upTo);
    if (ceiling > counted) total += (ceiling - counted) * rate;
    counted = upTo === null ? n : upTo;
    if (upTo !== null && n <= upTo) break;
  }

  return Math.max(total, ANNUAL_FLOOR);
}

/** The blended rate a school actually pays. Falls as the roll grows. */
export function effectiveRate(students) {
  const n = Math.max(1, Math.floor(students || 0));
  return annualCost(n) / n;
}

/** How the bill breaks down, for showing the working on an invoice. */
export function costBreakdown(students) {
  const n = Math.max(0, Math.floor(students || 0));
  const lines = [];
  let counted = 0;

  for (const { upTo, rate } of BANDS) {
    const ceiling = upTo === null ? n : Math.min(n, upTo);
    const inBand = ceiling - counted;
    if (inBand > 0) {
      lines.push({
        from: counted + 1,
        to: ceiling,
        students: inBand,
        rate,
        subtotal: inBand * rate,
      });
    }
    counted = upTo === null ? n : upTo;
    if (upTo !== null && n <= upTo) break;
  }

  const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
  // The floor is shown as an adjustment rather than silently replacing the
  // arithmetic — a bursar checking the sum should find it, not be surprised.
  const floorTopUp = Math.max(0, ANNUAL_FLOOR - subtotal);

  return { lines, subtotal, floorTopUp, total: subtotal + floorTopUp };
}

/**
 * Months left in the academic year, counting the month of `from` as whole.
 * 1 August is 12; 1 January is 7; 1 July is 1.
 */
export function monthsRemaining(from = new Date()) {
  const month = from.getMonth();
  // August (7) starts the year, so months since August, wrapped.
  const elapsed = (month - ACADEMIC_YEAR_ENDS_MONTH + 12) % 12;
  return 12 - elapsed;
}

/** What a school signing today pays for the remainder of this academic year. */
export function proratedCost(students, from = new Date()) {
  const months = monthsRemaining(from);
  return Math.round((annualCost(students) * months) / 12);
}

/** €11,200 — no decimals, because nothing here has any. */
export function formatMoney(amount) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
}

/** €18.67 — the per-student rate, where the cents do matter. */
export function formatRate(amount) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/** A plain-language description of the bands, for the small print. */
export function bandSummary() {
  return BANDS.map(({ upTo, rate }, i) => {
    const from = i === 0 ? 1 : BANDS[i - 1].upTo + 1;
    return {
      label: upTo === null ? `Students ${from}+` : (i === 0 ? `First ${upTo} students` : `Students ${from}–${upTo}`),
      rate,
    };
  });
}

/**
 * Turn a database key into something a human reads.
 *
 * The pattern this replaces was `.replace(/_/g, ' ')` with a CSS
 * `capitalize` class, in nine places. CSS uppercases the first letter of
 * every word and knows nothing about the subject, so `ib_core` rendered as
 * "Ib Core" on the billing page and `tok_task` as "Tok Task". In a product
 * sold to IB schools, misspelling IB is not a small thing.
 *
 * Acronyms are listed rather than detected: a rule like "two letters means an
 * acronym" would also shout at "PE" correctly and "Of" wrongly, and the list
 * of terms a school uses is short and stable.
 */

const ACRONYMS = new Map([
  ['ib', 'IB'],
  ['dp', 'DP'],
  ['myp', 'MYP'],
  ['pyp', 'PYP'],
  ['cp', 'CP'],
  ['tok', 'TOK'],
  ['ee', 'EE'],
  ['cas', 'CAS'],
  ['hl', 'HL'],
  ['sl', 'SL'],
  ['igcse', 'IGCSE'],
  ['gcse', 'GCSE'],
  ['ap', 'AP'],
  ['sen', 'SEN'],
  ['eal', 'EAL'],
  ['pe', 'PE'],
  ['id', 'ID'],
  ['url', 'URL'],
  ['csv', 'CSV'],
  ['pdf', 'PDF'],
  ['sms', 'SMS'],
  ['api', 'API'],
]);

/**
 * `ib_core` → `IB core`, `predicted_grade` → `Predicted grade`.
 *
 * Sentence case, not title case: only the first word is capitalised unless a
 * later word is an acronym. Title Case On Every Label reads like a form from
 * 1998, and the rest of this product is sentence case.
 */
export function humanise(key) {
  if (!key) return '';
  const words = String(key).replace(/[_-]+/g, ' ').trim().split(/\s+/);
  return words
    .map((word, i) => {
      const acronym = ACRONYMS.get(word.toLowerCase());
      if (acronym) return acronym;
      if (i === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      return word.toLowerCase();
    })
    .join(' ');
}

/** Every word capitalised, for the few places a proper name is wanted. */
export function humaniseTitle(key) {
  if (!key) return '';
  return String(key)
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => ACRONYMS.get(word.toLowerCase())
      || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

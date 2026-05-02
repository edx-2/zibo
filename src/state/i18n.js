// Tiny i18n. Loads both locales upfront (small JSON), reads from active one.

let DICT = { de: {}, en: {} };
let LANG = 'de';

export async function loadI18n() {
  const [de, en] = await Promise.all([
    fetch('./i18n/de.json').then(r => r.json()),
    fetch('./i18n/en.json').then(r => r.json())
  ]);
  DICT = { de, en };
}
export function setLang(lang) { LANG = lang in DICT ? lang : 'de'; }
export function lang() { return LANG; }
export function t(key) {
  return (DICT[LANG] && DICT[LANG][key]) || (DICT.en && DICT.en[key]) || key;
}

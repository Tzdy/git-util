import language, { Language } from "linguist-languages";

const map: Record<string, Language> = {};
const idMap: Record<string, Language> = {};

Object.values(language).forEach((lang) => {
  if (lang.type === "programming" || lang.type === "markup") {
    if (lang.extensions) {
      lang.extensions.forEach((key) => {
        map[key] = lang;
      });
      idMap[lang.languageId] = lang;
    }
  }
});

export function parseLanguageId(languageId: number | string) {
  return idMap[languageId];
}

export function parseLanguageAfterFix(languageId: number | string) {
  return map[languageId];
}

import language, { Language } from "linguist-languages";

const map: Record<string, Language | undefined> = {};
const idMap: Record<string, Language | undefined> = {};
const filenameMap: Record<string, Language | undefined> = {};

map[".md"] = language.Markdown;

Object.values(language).forEach((lang) => {
  if (lang.filenames) {
    lang.filenames.forEach((filename) => {
      filenameMap[filename] = lang;
    });
  }
  if (lang.type === "programming" || lang.type === "markup") {
    if (lang.extensions) {
      lang.extensions.forEach((key) => {
        if (!map[key]) {
          map[key] = lang;
        }
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

export function parseFilename(filename: string) {
  return map[filename];
}

import { translate } from 'google-translate-api-x';
import { logger } from './logger';

interface TranslationResult {
  text: string;
}

// Generic version that maintains the original object structure
const translateJSON = async <T extends Record<string, any>>(
  obj: T, 
  targetLang: string
): Promise<T> => {
  const translated = { ...obj } as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      try {
        const translationResult: TranslationResult = await translate(value, { to: targetLang });
        translated[key as keyof T] = translationResult.text as T[keyof T];
      } catch (error) {
        console.error(`Failed to translate key "${key}":`, error);
        // Keep original value on error
      }
    }
  }
  
  return translated;
};


export async function translateJSONWrapper(
  jsondata: Record<string, any>, 
  targetLang: string | 'en'
): Promise<Record<string, any>> {
  try {
    const translatedObj = await translateJSON(jsondata, targetLang);
    logger.info(translatedObj);
    return translatedObj;
  } catch (err: any) {
    logger.error(`Translation to ${targetLang} failed:`, err);
    throw err;
  }
}


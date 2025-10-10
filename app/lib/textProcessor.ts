import { translate } from 'google-translate-api-x';
import { jsondata } from '../api/stats/route';
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



translateJSON(jsondata, 'en-US')
  .then(translatedObj => {
    logger.log(translatedObj);
    
  })
  .catch((err: Error) => console.error(err));
import { translate } from 'google-translate-api-x';
import { logger } from './logger';

interface TranslationResult {
  text: string;
}

// Helper function to convert object values to sentences
const objectToSentences = <T extends Record<string, any>>(obj: T): Record<string, string> => {
  const sentences: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sentences[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sentences[key] = value.toString();
    } else if (Array.isArray(value)) {
      // Convert arrays to descriptive sentences
      if (value.length === 0) {
        sentences[key] = `No items in ${key}`;
      } else if (typeof value[0] === 'object') {
        // Handle array of objects
        sentences[key] = `${key} contains ${value.length} items: ${value.map((item, index) => 
          `item ${index + 1} has ${Object.keys(item).length} properties`
        ).join(', ')}`;
      } else {
        sentences[key] = `${key}: ${value.join(', ')}`;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Convert nested objects to descriptive sentences
      const nestedKeys = Object.keys(value);
      if (nestedKeys.length === 0) {
        sentences[key] = `Empty ${key}`;
      } else {
        sentences[key] = `${key} contains: ${nestedKeys.join(', ')}`;
      }
    }
  }
  
  return sentences;
};

// Helper function to reconstruct object from translated sentences
const sentencesToObject = <T extends Record<string, any>>(
  originalObj: T, 
  translatedSentences: Record<string, string>
): T => {
  const reconstructed = { ...originalObj } as T;
  
  for (const [key, translatedValue] of Object.entries(translatedSentences)) {
    if (key in originalObj) {
      const originalValue = originalObj[key];
      
      if (typeof originalValue === 'string') {
        reconstructed[key as keyof T] = translatedValue as T[keyof T];
      } else if (typeof originalValue === 'number') {
        // Try to parse numbers back, fallback to original if fails
        const num = parseFloat(translatedValue);
        reconstructed[key as keyof T] = (isNaN(num) ? originalValue : num) as T[keyof T];
      } else if (typeof originalValue === 'boolean') {
        // Try to parse boolean, fallback to original
        const bool = translatedValue.toLowerCase() === 'true' || translatedValue === '1';
        reconstructed[key as keyof T] = (translatedValue ? bool : originalValue) as T[keyof T];
      }
      // For arrays and objects, we keep the original structure but update string values within them
    }
  }
  
  return reconstructed;
};

// Main translation function
const translateJSON = async <T extends Record<string, any>>(
  obj: T, 
  targetLang: string
): Promise<T> => {
  try {
    // Convert object to sentences for translation
    const sentences = objectToSentences(obj);
    
    // Translate each sentence
    const translatedSentences: Record<string, string> = {};
    
    for (const [key, sentence] of Object.entries(sentences)) {
      try {
        const translationResult: TranslationResult = await translate(sentence, { to: targetLang });
        translatedSentences[key] = translationResult.text;
      } catch (error) {
        console.error(`Failed to translate key "${key}":`, error);
        translatedSentences[key] = sentence; // Fallback to original
      }
    }
    
    // Reconstruct the object with translated values
    const translatedObj = sentencesToObject(obj, translatedSentences);
    
    return translatedObj;
    
  } catch (error) {
    console.error('Translation failed:', error);
    return obj; // Return original object if translation fails
  }
};

// Clean wrapper function that ensures no logger symbols are returned
export async function translateJSONWrapper(
  jsondata: Record<string, any>, 
  targetLang: string = 'en'
): Promise<Record<string, any>> {
  try {
    const translatedObj = await translateJSON(jsondata, targetLang);
    
    // Log the result (but don't return the logger)
    logger.info('Translation completed', { 
      originalKeys: Object.keys(jsondata),
      translatedKeys: Object.keys(translatedObj)
    });
    
    // Return a clean, serializable object
    return JSON.parse(JSON.stringify(translatedObj));
    
  } catch (err: any) {
    logger.error(`Translation to ${targetLang} failed:`, err);
    
    // Return a clean error object
    return JSON.parse(JSON.stringify({
      error: 'Translation failed',
      message: err.message,
      fallbackData: jsondata
    }));
  }
}

// Alternative simpler version that focuses on sentence formatting
export async function translateToSentences(
  jsondata: Record<string, any>, 
  targetLang: string = 'en'
): Promise<Record<string, string>> {
  try {
    const sentences = objectToSentences(jsondata);
    const translatedSentences: Record<string, string> = {};
    
    for (const [key, sentence] of Object.entries(sentences)) {
      try {
        const translationResult: TranslationResult = await translate(sentence, { to: targetLang });
        translatedSentences[key] = translationResult.text;
      } catch (error) {
        console.error(`Failed to translate key "${key}":`, error);
        translatedSentences[key] = sentence;
      }
    }
    
    // Return clean object
    return JSON.parse(JSON.stringify(translatedSentences));
    
  } catch (err: any) {
    logger.error(`Sentence translation to ${targetLang} failed:`, err);
    return JSON.parse(JSON.stringify({
      error: 'Sentence translation failed',
      message: err.message
    }));
  }
}

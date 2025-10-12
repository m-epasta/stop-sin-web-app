import { translate } from 'google-translate-api-x';
import { logger } from './logger';

/**
 * Represents the result from a translation operation
 * This ensures we get a structured response rather than just a raw string,
 * making it easier to extend with additional metadata later
 */
interface TranslationResult {
  text: string; // The actual translated text content
}
export async function translateJSON<T extends Record<string, any>>(
  obj: T, 
  targetLang: string = 'en'
): Promise<T> {
  try {
    const translated = { ...obj } as T; // copy of obj with T takes same types of obj
    
    for (const [key, value] of Object.entries(obj)) { /* iterate through value of a key in an object*/
      if (typeof value === 'string') { /* if the value of a key is a string perform the action below*/
        try {
          const result: TranslationResult = await translate(value, { to: targetLang }); /* init a constant that takes as a type 'TranslationResult' 
          and translate it with the google-api, it sends as params the value of the key and the target lang in json*/
          translated[key as keyof T] = result.text as T[keyof T]; /* access the property named key on object translated, and assert that key is a valid property name of type T
          right side: assign the translated text and assert as the same type of the key as T */
        } catch (error) {
          console.warn(`Translation failed for key "${key}":`, error);
          // Keep original value on translation failure
        }
      } else if (Array.isArray(value)) { /* check if the value is an array */ 
        // Recursively translate array items
        translated[key as keyof T] = await Promise.all( /* access the property named key on object translated, and assert that key is a valid property name of type T
           Assign the resolved results of multiple promises processed in parallel */
          value.map(async (item) => { /* map a value */ 
            if (typeof item === 'string') {
              try {
                const result: TranslationResult = await translate(item, { to: targetLang });
                return result.text; /* return the result of the translation made 1 line up*/
              } catch (error) {
                console.warn(`Translation failed for array item:`, error);
                return item;
              }
            } else if (typeof item === 'object' && item !== null) {
              return await translateJSON(item, targetLang); // if the item is an object and not null process a JSON translation 
            }
            return item;
          })
        ) as T[keyof T];// assert the returned promise results to the same type of the key as T
      } else if (typeof value === 'object' && value !== null) {
        // Recursively translate nested objects
        translated[key as keyof T] = await translateJSON(value, targetLang) as T[keyof T];
      }
    }
    
    return translated; // returns result 
  } catch (error) {
    console.error('JSON translation failed:', error);
    return obj; // Return original object on complete failure
  }
}

// Clean wrapper for safe serialization
export async function translateJSONWrapper(
  data: Record<string, any>, // pass the key data as a string and the value as any type
  targetLang: string = 'en' // make target lang as a string 'en'by default
): Promise<Record<string, any>> /* return a promise with a object type as key = string value = any*/ {
  try {
    const translated = await translateJSON(data, targetLang); // call translateJSON with the data as an object and the target language, here using the default value 'en'
    
    logger.info('Translation completed', { /* log a message that indicates the translation has been completed, return the original key as JSON but just the keys and the target lang*/
      originalKeys: Object.keys(data),
      targetLanguage: targetLang
    });
    
    return JSON.parse(JSON.stringify(translated)); // create a deep copy(no reference because its now a string) and remake it as a json object
    
  } catch (error: any) {
    logger.error(`Translation to ${targetLang} failed:`, error); // log the error with the target lang and error
    
    return { /* return a JSON object */
      error: 'Translation failed', // generic error message (string defined to wrap the type of error there)
      message: error.message, // log the error message as a key/value pair
      fallbackData: JSON.parse(JSON.stringify(data)) // Clean fallback using a photocopy of the data
    };
  }
}

// Human-readable sentence formatter
export function formatToHumanReadable(data: any, indentLevel: number = 0): string {
  const indent = '  '.repeat(indentLevel); // repeat an indent of 2 spaces based on the param indentLevel
  const lines: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return `${indent}${data}`; // if theres no data or the data is not an object, return the data with indent and the data as a string
  }
  
  for (const [key, value] of Object.entries(data)) /* iterate over key value pairs of the object data */ {
    // Skip technical fields
    if (['success', 'rateLimit'].includes(key)) continue; // if the key is 'success', 'rateLimit' skip the key
    
    const formattedKey = key === 'accessType' ? 'Access Type' : 
                        key === 'topCountries' ? 'Top Countries' :
                        key.charAt(0).toUpperCase() + key.slice(1); /* reformat certain keys with the conditionnal statement ? : 
                        * the code next to '?' assign a value if the condition is true, otherwise it assigns the value next to ':' 
                        * the 3rd statement upperCase the first letter of the key to uppercase and the rest as it was if the key isnt 'accessType' or 'topCountries'
                         */
    
    if (key === 'data') { 
      lines.push(`${indent}### Data Analysis`); // add an header with indent
      lines.push(formatToHumanReadable(value, indentLevel + 1)); // recursively call formatToHumanReadable for the 'data' key and add the result with indent
    } else if (Array.isArray(value)) { 
      if (value.length === 0) {
        lines.push(`${indent}${formattedKey}: No items`); // if no items
      } else if (key === 'topCountries') {
        lines.push(`${indent}${formattedKey}:`); // special case for 'topCountries'
        value.forEach((country, index) => {
          lines.push(`${indent}  ${index + 1}. ${country.country}: ${country.users} users`);
        });
      } else {
        lines.push(`${indent}${formattedKey}:`);
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            lines.push(`${indent}  - Item ${index + 1}:`);
            lines.push(formatToHumanReadable(item, indentLevel + 2));
          } else {
            lines.push(`${indent}  - ${item}`);
          }
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${indent}${formattedKey}:`);
      lines.push(formatToHumanReadable(value, indentLevel + 1));
    } else {
      lines.push(`${indent}${formattedKey}: ${value}`);
    }
  }
  
  return lines.join('\n');
}

// Natural language sentence generator
export function createNaturalLanguageReport(data: any): string {
  const sections: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return String(data);
  }
  
  // Header section
  if (data.accessType) {
    sections.push(`📊 Analytics Report: ${data.accessType.replace('_', ' ').toUpperCase()}`);
    sections.push('');
  }
  
  if (data.message) {
    sections.push(`ℹ️  ${data.message}`);
    sections.push('');
  }
  
  // Data analysis section
  if (data.data) {
    sections.push('### 📈 Data Insights');
    
    if (data.data.message) {
      sections.push(data.data.message);
    }
    
    if (data.data.average !== undefined) {
      sections.push(`• Average: ${data.data.average} users`);
    }
    
    if (data.data.users !== undefined) {
      sections.push(`• Total Users: ${data.data.users}`);
    }
    
    if (data.data.growth) {
      sections.push(`• Growth: ${data.data.growth}`);
    }
    
    if (data.data.period) {
      sections.push(`• Period: ${data.data.period}`);
    }
    
    if (data.data.date) {
      sections.push(`• Date: ${data.data.date}`);
    }
    
    if (data.data.activeSessions !== undefined) {
      sections.push(`• Active Sessions: ${data.data.activeSessions}`);
    }
    
    if (data.data.topCountries && data.data.topCountries.length > 0) {
      sections.push('');
      sections.push('### 🌍 Top Performing Countries');
      data.data.topCountries.forEach((country: any, index: number) => {
        sections.push(`${index + 1}. ${country.country}: ${country.users} users`);
      });
    }
    
    sections.push('');
  }
  
  // Rate limit info (if present)
  if (data.rateLimit) {
    sections.push('### ⚡ API Usage');
    sections.push(`• Remaining Requests: ${data.rateLimit.remaining}`);
    
    if (data.rateLimit.resetTime) {
      try {
        const resetTime = new Date(data.rateLimit.resetTime);
        sections.push(`• Reset Time: ${resetTime.toLocaleString()}`);
      } catch {
        sections.push(`• Reset Time: ${data.rateLimit.resetTime}`);
      }
    }
  }
  
  return sections.join('\n');
}

// Combined translation and formatting
export async function createTranslatedReport(
  data: Record<string, any>, 
  targetLang: string = 'en',
  format: 'structured' | 'natural' = 'natural'
): Promise<string> {
  try {
    // Translate the data first
    const translatedData = await translateJSONWrapper(data, targetLang);
    
    // Format based on preference
    if (format === 'structured') {
      return formatToHumanReadable(translatedData);
    } else {
      return createNaturalLanguageReport(translatedData);
    }
    
  } catch (error: any) {
    console.error('Report creation failed:', error);
    
    // Fallback to original data formatting
    if (format === 'structured') {
      return formatToHumanReadable(data);
    } else {
      return createNaturalLanguageReport(data);
    }
  }
}

// Utility function for simple sentence translation (legacy support)
export async function translateText(
  text: string, 
  targetLang: string = 'en'
): Promise<string> {
  try {
    const result: TranslationResult = await translate(text, { to: targetLang });
    return result.text;
  } catch (error) {
    console.error('Text translation failed:', error);
    return text; // Return original text on failure
  }
}

import { translate } from 'google-translate-api-x';
import { logger } from './logger';

interface TranslationResult {
  text: string;
}

// Enhanced JSON translation that preserves structure
export async function translateJSON<T extends Record<string, any>>(
  obj: T, 
  targetLang: string = 'en'
): Promise<T> {
  try {
    const translated = { ...obj } as T;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Translate string values
        try {
          const result: TranslationResult = await translate(value, { to: targetLang });
          translated[key as keyof T] = result.text as T[keyof T];
        } catch (error) {
          console.warn(`Translation failed for key "${key}":`, error);
          // Keep original value on translation failure
        }
      } else if (Array.isArray(value)) {
        // Recursively translate array items
        translated[key as keyof T] = await Promise.all(
          value.map(async (item) => {
            if (typeof item === 'string') {
              try {
                const result: TranslationResult = await translate(item, { to: targetLang });
                return result.text;
              } catch (error) {
                console.warn(`Translation failed for array item:`, error);
                return item;
              }
            } else if (typeof item === 'object' && item !== null) {
              return await translateJSON(item, targetLang);
            }
            return item;
          })
        ) as T[keyof T];
      } else if (typeof value === 'object' && value !== null) {
        // Recursively translate nested objects
        translated[key as keyof T] = await translateJSON(value, targetLang) as T[keyof T];
      }
    }
    
    return translated;
  } catch (error) {
    console.error('JSON translation failed:', error);
    return obj; // Return original object on complete failure
  }
}

// Clean wrapper for safe serialization
export async function translateJSONWrapper(
  data: Record<string, any>, 
  targetLang: string = 'en'
): Promise<Record<string, any>> {
  try {
    const translated = await translateJSON(data, targetLang);
    
    logger.info('Translation completed', {
      originalKeys: Object.keys(data),
      targetLanguage: targetLang
    });
    
    // Ensure clean serializable output
    return JSON.parse(JSON.stringify(translated));
    
  } catch (error: any) {
    logger.error(`Translation to ${targetLang} failed:`, error);
    
    // Return clean error response
    return {
      error: 'Translation failed',
      message: error.message,
      fallbackData: JSON.parse(JSON.stringify(data)) // Clean fallback
    };
  }
}

// Human-readable sentence formatter
export function formatToHumanReadable(data: any, indentLevel: number = 0): string {
  const indent = '  '.repeat(indentLevel);
  const lines: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return `${indent}${data}`;
  }
  
  for (const [key, value] of Object.entries(data)) {
    // Skip technical fields
    if (['success', 'rateLimit'].includes(key)) continue;
    
    const formattedKey = key === 'accessType' ? 'Access Type' : 
                        key === 'topCountries' ? 'Top Countries' :
                        key.charAt(0).toUpperCase() + key.slice(1);
    
    if (key === 'data') {
      lines.push(`${indent}### Data Analysis`);
      lines.push(formatToHumanReadable(value, indentLevel + 1));
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${indent}${formattedKey}: No items`);
      } else if (key === 'topCountries') {
        lines.push(`${indent}${formattedKey}:`);
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
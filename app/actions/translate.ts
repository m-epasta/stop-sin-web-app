'use server';

import { 
  translateJSONWrapper, 
  createTranslatedReport,
  formatToHumanReadable,
  createNaturalLanguageReport,
  translateText 
} from '../lib/textProcessor.servor';

// Translate data while preserving structure
export async function translateData(data: any, targetLang: string = 'en') {
    return await translateJSONWrapper(data, targetLang);
}

// Create a translated report in natural language format
export async function createTranslatedReportAction(data: any, targetLang: string = 'en', format: 'structured' | 'natural' = 'natural') {
    return await createTranslatedReport(data, targetLang, format);
}

// Format data to human readable structure (without translation)
export async function formatToHumanReadableAction(data: any) {
    return formatToHumanReadable(data);
}

// Create natural language report (without translation)
export async function createNaturalLanguageReportAction(data: any) {
    return createNaturalLanguageReport(data);
}

// Simple text translation
export async function translateTextAction(text: string, targetLang: string = 'en') {
    return await translateText(text, targetLang);
}

// Legacy function for backward compatibility
export async function objectToSentences(data: any, targetLang: string = 'en') {
    return await createTranslatedReport(data, targetLang, 'structured');
}

// Legacy function for backward compatibility
export async function translateAndFormatToSentences(data: any, targetLang: string = 'en') {
    return await createTranslatedReport(data, targetLang, 'natural');
}
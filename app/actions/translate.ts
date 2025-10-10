'use server';

import { translateJSONWrapper } from '../lib/textProcessor.servor';

export async function translateData(data: any, targetLang: string = 'en') {
    return await translateJSONWrapper(data, targetLang);
}

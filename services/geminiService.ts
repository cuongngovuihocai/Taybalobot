
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { decode } from '../utils/audioUtils';
import { ScriptLine, Difficulty, ConversationTurnForFeedback } from '../types';
import { scriptGenerationPrompt, feedbackGenerationPrompt, translationPrompt } from '../constants';

const scriptModel = 'gemini-2.5-pro';
const feedbackModel = 'gemini-2.5-flash';
const ttsModel = 'gemini-2.5-flash-preview-tts';
const translationModel = 'gemini-2.5-flash';

// In-memory cache for generated audio
const audioCache = new Map<string, Uint8Array>();

export const clearAudioCache = () => {
    audioCache.clear();
};

const scriptSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        role: { type: Type.STRING },
        text: { type: Type.STRING },
        translation: { type: Type.STRING },
      },
      required: ['role', 'text', 'translation'],
    },
};

export const generateConversationScript = async (topic: string, difficulty: Difficulty, apiKey: string): Promise<ScriptLine[]> => {
    if (!apiKey) throw new Error("API Key is required.");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: scriptModel,
            contents: scriptGenerationPrompt(topic, difficulty),
            config: {
                responseMimeType: "application/json",
                responseSchema: scriptSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const script = JSON.parse(jsonText);
        // Basic validation
        if (Array.isArray(script) && script.length > 0 && script[0].role) {
            return script as ScriptLine[];
        }
        throw new Error("Invalid script format received from AI.");

    } catch (error) {
        console.error("Error generating conversation script:", error);
        throw new Error("Failed to generate a conversation script. Please check your API Key and network connection.");
    }
};

export const generateSpeech = async (text: string, apiKey: string): Promise<Uint8Array | null> => {
    if (audioCache.has(text)) {
        return audioCache.get(text) ?? null;
    }
    if (!apiKey) throw new Error("API Key is required for TTS.");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const audioBytes = decode(base64Audio);
            audioCache.set(text, audioBytes); // Cache the result
            return audioBytes;
        }
        return null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

export const generateFeedback = async (history: ConversationTurnForFeedback[], difficulty: Difficulty, score: number, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key is required.");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: feedbackModel,
            contents: feedbackGenerationPrompt(history, difficulty, score),
        });
        return response.text;
    } catch (error) {
        console.error("Error generating feedback:", error);
        throw new Error("Failed to generate feedback from AI.");
    }
};

export const generateTranslation = async (text: string, language: string, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key is required.");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: translationModel,
            contents: translationPrompt(text, language),
        });
        return response.text;
    } catch (error) {
        console.error(`Error translating text to ${language}:`, error);
        throw new Error(`Failed to translate text to ${language}.`);
    }
};

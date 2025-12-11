import { GoogleGenAI, Type } from "@google/genai";
import { Rarity, EggTier } from "../types";

// Initialize the client. The key must be present in process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_ANIMALS = ['Lion', 'Panda', 'Penguin', 'Gorilla', 'Shark', 'Eagle', 'Turtle', 'Elephant', 'Tiger', 'Frog', 'Axolotl', 'Capybara', 'Dragon'];

export const generateAnimalMetadata = async (tier: EggTier = EggTier.BASIC, parent1Name?: string, parent2Name?: string): Promise<{
  name: string;
  description: string;
  rarity: Rarity;
  dailyYield: number;
  marketValue: number;
  visualPrompt: string;
  traits: { name: string, value: number }[];
}> => {
  const isHybrid = !!(parent1Name && parent2Name);
  
  // Adjust prompt based on Tier to influence rarity
  let tierContext = "";
  switch (tier) {
    case EggTier.BASIC: tierContext = "Bias towards Common or Rare. Lower stats."; break;
    case EggTier.SILVER: tierContext = "Bias towards Rare or Epic. Balanced stats."; break;
    case EggTier.GOLD: tierContext = "Bias towards Epic or Legendary. High stats."; break;
    case EggTier.DIAMOND: tierContext = "Bias towards Legendary or Mythical. Extreme stats."; break;
  }

  let prompt = "";
  if (isHybrid) {
    prompt = `Create a unique HYBRID crypto-animal NFT by combining a ${parent1Name} and a ${parent2Name}. 
    Invent a cool, edgy name. Write a hype-filled 1-sentence description. 
    Assign it a rarity (Epic, Legendary, or Mythical) and a daily yield value ($ZOO/day) between 2000 and 10000.
    Estimate a 'market value' in USD (high variance).
    Generate 4 RPG-style traits (e.g., Aggression, Cuteness, Hype, Aura) with values 0-100.
    Provide a visual prompt to generate an image of this creature.`;
  } else {
    const randomBase = BASE_ANIMALS[Math.floor(Math.random() * BASE_ANIMALS.length)];
    prompt = `Create a unique variation of a ${randomBase} for a crypto game. Context: ${tierContext}
    Invent a cool name. Write a 1-sentence description. 
    Assign it a rarity based on the context.
    Assign a daily yield value ($ZOO/day).
    Estimate a 'market value' in USD.
    Generate 4 RPG-style traits (e.g., Strength, Speed, Memeability) with values 0-100.
    Provide a visual prompt to generate an image of this creature.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          rarity: { type: Type.STRING, enum: Object.values(Rarity) },
          dailyYield: { type: Type.NUMBER },
          marketValue: { type: Type.NUMBER },
          visualPrompt: { type: Type.STRING },
          traits: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          }
        },
        required: ['name', 'description', 'rarity', 'dailyYield', 'marketValue', 'visualPrompt', 'traits']
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate animal metadata");
  }

  return JSON.parse(response.text);
};

export const generateAnimalImage = async (visualPrompt: string, rarity: string): Promise<string> => {
  try {
    // Add rarity context to image style
    const stylePrompt = `A high-quality ${rarity} tier crypto collectible NFT sticker of: ${visualPrompt}. 
    Glossy finish, vibrant colors, white background, vector art style, highly detailed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: stylePrompt }]
      },
      config: {}
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
         if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
         }
      }
    }
    
    return `https://picsum.photos/400/400?random=${Math.random()}`;
    
  } catch (error) {
    console.error("Image generation failed:", error);
    return `https://picsum.photos/400/400?random=${Math.random()}`;
  }
};
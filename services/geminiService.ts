
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { UserProfile, DailyIntake } from "../types";

// Função para obter a chave de forma segura
const getApiKey = () => {
  return process?.env?.API_KEY || (window as any).process?.env?.API_KEY || "";
};

const buildSystemInstruction = (profile: UserProfile | null) => {
  if (!profile) return "Você é a Nutri-AI Expert, especialista em nutrição clínica.";
  const hydration = (profile.weight * 35) / 1000;
  return `Você é a Nutri-AI Expert, especialista em nutrição clínica.
  
  DADOS DO PACIENTE:
  - Nome: ${profile.name}
  - Peso Atual: ${profile.weight}kg
  - Meta Água: ${hydration.toFixed(1)}L
  - Objetivo: ${profile.goalType}
  
  Sua missão é ser didática, empática e técnica. Ao analisar refeições, forneça feedback sobre a qualidade dos alimentos e como eles ajudam no objetivo do paciente.`;
};

export class NutritionChatSession {
  private chat: Chat | null = null;
  private profile: UserProfile | null;
  private ai: GoogleGenAI;

  constructor(profile: UserProfile | null) {
    this.profile = profile;
    const apiKey = getApiKey();
    this.ai = new GoogleGenAI({ apiKey });
    
    if (apiKey) {
      this.chat = this.ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: buildSystemInstruction(profile),
          temperature: 0.7,
        },
      });
    }
  }

  async sendMessage(text: string, base64Image?: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) return "A API Key não foi configurada. Verifique as variáveis de ambiente.";

    try {
      if (base64Image) {
        const imagePart = {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1],
          },
        };
        const promptPart = { text: text || "Analise este prato de forma didática e motivadora, estimando os macros se possível." };
        const response = await this.ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts: [imagePart, promptPart] },
          config: { 
            systemInstruction: buildSystemInstruction(this.profile)
          }
        });
        return response.text || "Vi sua foto, mas descreva o que tem nela para eu ajudar melhor!";
      }

      if (!this.chat) {
        this.chat = this.ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: { systemInstruction: buildSystemInstruction(this.profile) }
        });
      }

      const result: GenerateContentResponse = await this.chat.sendMessage({ message: text });
      return result.text || "Desculpe, tive um pequeno problema técnico. Pode repetir?";
    } catch (error) {
      console.error("Chat Error:", error);
      return "Ops! Tive um problema de conexão. Verifique se a API Key é válida e se há conexão com a internet.";
    }
  }

  async analyzeNutritionalContent(text: string): Promise<DailyIntake | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Extraia os macros nutricionais totais (estimados) do seguinte texto de refeição ou dia alimentar: "${text}". 
        
        Regras:
        1. Se houver múltiplos alimentos, some tudo.
        2. Retorne APENAS o JSON.
        3. Se não houver comida no texto, retorne zeros.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER, description: "Total de kcal" },
              protein: { type: Type.NUMBER, description: "Total de proteínas em gramas" },
              carbs: { type: Type.NUMBER, description: "Total de carboidratos em gramas" },
              fats: { type: Type.NUMBER, description: "Total de gorduras em gramas" },
            },
            required: ["calories", "protein", "carbs", "fats"],
          },
        },
      });
      const jsonStr = response.text?.trim();
      return jsonStr ? JSON.parse(jsonStr) : null;
    } catch (e) {
      console.error("Erro na extração de macros:", e);
      return null;
    }
  }
}

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateClassDescription = async (studentName: string, context: string = "") => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um instrutor de Pilates/Fitness. Escreva uma breve descrição técnica e motivadora para uma aula agendada para o aluno ${studentName}. ${context ? `Contexto adicional: ${context}` : ""} Seja conciso (máximo 2 parágrafos).`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating description:", error);
    return "Erro ao gerar descrição.";
  }
};

export const generateWhatsAppMessage = async (studentName: string, type: 'lembrete' | 'boas-vindas' | 'cobranca') => {
  const prompts = {
    'lembrete': `Escreva uma mensagem amigável de WhatsApp lembrando o aluno ${studentName} de sua aula amanhã. Inclua emojis.`,
    'boas-vindas': `Escreva uma mensagem calorosa de WhatsApp dando as boas-vindas ao aluno ${studentName} ao nosso studio de Pilates.`,
    'cobranca': `Escreva uma mensagem educada e profissional de WhatsApp para o aluno ${studentName} sobre uma mensalidade pendente.`
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompts[type],
    });
    return response.text;
  } catch (error) {
    console.error("Error generating message:", error);
    return "Erro ao gerar mensagem.";
  }
};

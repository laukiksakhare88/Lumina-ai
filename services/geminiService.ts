
import { GoogleGenAI } from "@google/genai";
import { AppMode, Message, MemoryItem, GroundingChunk } from "../types";
import { SYSTEM_PROMPTS, CORE_IDENTITY } from "../constants";

export interface StreamResult {
  text?: string;
  groundingChunks?: GroundingChunk[];
}

export class LuminaEngine {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async *streamResponse(
    mode: AppMode,
    history: Message[],
    userInput: string,
    memory: MemoryItem[],
    user?: { name: string; email: string } | null,
    attachment?: { data: string; mimeType: string }
  ): AsyncGenerator<StreamResult, void, unknown> {
    const memoryContext = memory.length > 0 
      ? `Recent Facts Learned: ${memory.map(m => m.fact).join(". ")}` 
      : "";
    
    const identityContext = user 
      ? `USER IDENTITY: The person you are speaking with is ${user.name} (${user.email}). Adjust your tone to be personalized for them.` 
      : "USER IDENTITY: Guest User.";

    const systemInstruction = `
      ${CORE_IDENTITY}
      ${identityContext}
      ${SYSTEM_PROMPTS[mode]}
      ${memoryContext}
      
      CRITICAL INSTRUCTION:
      Strictly prohibited to use symbols: *, $, [, ], {, }. 
      # is allowed ONLY for ### headers.
    `;

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [
        ...(msg.attachment ? [{ inlineData: { data: msg.attachment.data, mimeType: msg.attachment.mimeType } }] : []),
        { text: msg.content }
      ]
    }));

    const currentParts: any[] = [{ text: userInput }];
    if (attachment) {
      currentParts.unshift({
        inlineData: {
          data: attachment.data,
          mimeType: attachment.mimeType
        }
      });
    }

    contents.push({ role: 'user', parts: currentParts });

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const responseStream = await this.ai.models.generateContentStream({
          model: 'gemini-3-flash-preview',
          contents,
          config: {
            systemInstruction,
            temperature: 0.5,
            topP: 0.9,
            tools: [{ googleSearch: {} }]
          }
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
          const groundingChunks = groundingMetadata?.groundingChunks;

          if (text || groundingChunks) {
            yield {
              text: text ? text.replace(/[*$\[\]{}]/g, '') : undefined,
              groundingChunks: (groundingChunks as GroundingChunk[]) || undefined
            };
          }
        }
        return;
      } catch (error: any) {
        const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED';
        
        if (isQuotaError && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          await this.sleep(delay);
          continue;
        }

        console.error("LUMINA Engine Error:", error);
        yield { 
          text: isQuotaError 
            ? "### System Capacity Notification\nThe neural link is currently at peak capacity. Please pause for a moment."
            : "### Technical Interruption\nAn unexpected state occurred. Please try again."
        };
        return;
      }
    }
  }
}

import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useDeepJournalsContext } from './DeepJournalsContext';
import { useElectronStore } from 'renderer/hooks/useElectronStore';

const OLLAMA_URL = 'http://localhost:11434/api';
const OPENAI_URL = 'https://api.openai.com/v1';
const DEFAULT_PROMPT =
  'You are an AI within a journaling app. Your job is to help the user reflect on their thoughts in a thoughtful and kind manner. The user can never directly address you or directly respond to you. Try not to repeat what the user said, instead try to seed new ideas, encourage or debate. Keep your responses concise, but meaningful.';

export const AIContext = createContext();

export const AIContextProvider = ({ children }) => {
  const { currentDeepJournal, updateCurrentDeepJournal } = useDeepJournalsContext();
  const [ai, setAi] = useState(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [deepJournalAIProvider, setDeepJournalAIProvider] = useElectronStore(
    'deepJournalAIProvider',
    'gemini'
  );
  const [model, setModel] = useElectronStore('model', 'gemini-2.0-flash');
  const [embeddingModel, setEmbeddingModel] = useElectronStore(
    'embeddingModel',
    'text-embedding-004'
  );
  const [baseUrl, setBaseUrl] = useElectronStore('baseUrl', OPENAI_URL);

  const setupAi = useCallback(async () => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available, skipping AI setup');
      return;
    }

    const key = await window.electron.ipc.invoke('get-ai-key');
    if (!key && deepJournalAIProvider !== 'ollama') return;

    try {
      if (deepJournalAIProvider === 'ollama') {
        setAi({ type: 'ollama' });
      } else if (deepJournalAIProvider === 'gemini') {
        if (!key || !key.startsWith('AIza')) {
          console.error('Invalid Gemini API key format');
          return;
        }
        const geminiInstance = new GoogleGenerativeAI(key);
        setAi({ type: 'gemini', instance: geminiInstance });
      } else {
        const openaiInstance = new OpenAI({
          baseURL: baseUrl,
          apiKey: key,
          dangerouslyAllowBrowser: true,
        });
        setAi({ type: 'openai', instance: openaiInstance });
      }
    } catch (error) {
      console.error('Failed to setup AI provider:', error);
    }
  }, [deepJournalAIProvider, baseUrl]);

  useEffect(() => {
    if (currentDeepJournal) {
      console.log('🧠 Syncing current deep journal');
      if (currentDeepJournal.AIPrompt) setPrompt(currentDeepJournal.AIPrompt);
      setupAi();
    }
  }, [currentDeepJournal, baseUrl, setupAi]);

  const generateCompletion = useCallback(
    async (context, callback) => {
      if (!ai) return;

      try {
        if (ai.type === 'ollama') {
          const response = await fetch(`${OLLAMA_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages: context }),
          });

          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.trim() !== '') {
                const jsonResponse = JSON.parse(line);
                if (!jsonResponse.done) {
                  callback(jsonResponse.message.content);
                }
              }
            }
          }
        } else if (ai.type === 'gemini') {
          console.log('🤖 Using Gemini AI with model:', model);
          const geminiModel = ai.instance.getGenerativeModel({ model });

          // Gemini only supports 'user' and 'model' roles
          // Combine all messages into a single prompt for Gemini
          const combinedPrompt = context.map(msg => {
            if (msg.role === 'system') {
              return `System: ${msg.content}`;
            }
            return `User: ${msg.content}`;
          }).join('\n\n');

          const result = await geminiModel.generateContentStream(combinedPrompt);

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              callback(chunkText);
            }
          }
        } else {
          const stream = await ai.instance.chat.completions.create({
            model,
            stream: true,
            max_tokens: 500,
            messages: context,
          });

          for await (const part of stream) {
            callback(part.choices[0].delta.content);
          }
        }
      } catch (error) {
        console.error('AI request failed:', error);
        throw error;
      }
    },
    [ai, model]
  );

  const prepareCompletionContext = useCallback(
    (thread) => {
      return [
        { role: 'system', content: prompt },
        {
          role: 'system',
          content: 'You can only respond in plaintext, do NOT use HTML.',
        },
        ...thread.map((post) => ({ role: 'user', content: post.content })),
      ];
    },
    [prompt]
  );

  const checkApiKeyValidity = useCallback(async () => {
    if (!window.electron?.ipc?.invoke) {
      console.warn('Electron IPC not available');
      return false;
    }
    const key = await window.electron.ipc.invoke('get-ai-key');

    if (!key) return false;

    // Basic validation for different providers
    if (deepJournalAIProvider === 'gemini') {
      // Gemini API keys start with 'AIza'
      return key.startsWith('AIza');
    } else if (deepJournalAIProvider === 'openai') {
      // OpenAI API keys start with 'sk-'
      return key.startsWith('sk-');
    }

    return true; // For ollama or other providers
  }, [deepJournalAIProvider]);

  const AIContextValue = {
    ai,
    baseUrl,
    setBaseUrl,
    prompt,
    setPrompt,
    setKey: (secretKey) => window.electron?.ipc?.invoke ? window.electron.ipc.invoke('set-ai-key', secretKey) : Promise.resolve(),
    getKey: () => window.electron?.ipc?.invoke ? window.electron.ipc.invoke('get-ai-key') : Promise.resolve(null),
    validKey: checkApiKeyValidity,
    deleteKey: () => window.electron?.ipc?.invoke ? window.electron.ipc.invoke('delete-ai-key') : Promise.resolve(),
    updateSettings: (newPrompt) =>
      updateCurrentDeepJournal({ ...currentDeepJournal, AIPrompt: newPrompt }),
    model,
    setModel,
    embeddingModel,
    setEmbeddingModel,
    generateCompletion,
    prepareCompletionContext,
    deepJournalAIProvider,
    setDeepJournalAIProvider,
  };

  return (
    <AIContext.Provider value={AIContextValue}>{children}</AIContext.Provider>
  );
};

export const useAIContext = () => useContext(AIContext);

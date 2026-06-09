import { create } from 'zustand';
import { listAiInteractions, queryAi } from '@/lib/protectedEndpoints';

export interface AiInteraction {
  id: number;
  prompt: string;
  response: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
}

interface AiStore {
  history: AiInteraction[];
  loading: boolean;
  error: string;
  fetchHistory: () => Promise<void>;
  sendPrompt: (prompt: string) => Promise<AiInteraction | null>;
}

export const useAiStore = create<AiStore>((set) => ({
  history: [],
  loading: false,
  error: '',

  fetchHistory: async () => {
    set({ loading: true, error: '' });

    try {
      const response = await listAiInteractions();
      const payload = Array.isArray(response.data)
        ? response.data
        : response.data ?? response;

      set({ history: payload, loading: false });
    } catch {
      set({
        loading: false,
        error: 'Unable to load AI interaction history.',
      });
    }
  },

  sendPrompt: async (prompt: string) => {
    set({ loading: true, error: '' });

    try {
      const response = await queryAi(prompt);
      const payload = response.data ?? response;

      set((state) => ({
        history: [payload, ...state.history],
        loading: false,
      }));

      return payload;
    } catch {
      set({
        loading: false,
        error: 'Unable to send prompt to the AI service.',
      });
      return null;
    }
  },
}));
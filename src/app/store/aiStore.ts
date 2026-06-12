import { create } from 'zustand';
import { listAiFaqs, listAiInteractions, queryAi } from '@/lib/protectedEndpoints';

export interface AiFaq {
  id: number;
  question: string;
  answer: string;   // ✅ normalized to 'answer'
  active: boolean;
  role?: string;    // ✅ role name string from backend
}

export interface AiInteraction {
  id: number;
  prompt: string;
  answer?: string;   // ✅ use 'answer' consistently
  model?: string;
  status?: 'pending' | 'completed' | 'failed';
  faq_used?: boolean;
  created_at?: string;
}

interface AiStore {
  faqs: AiFaq[];
  history: AiInteraction[];
  role?: string; // ✅ always a string role name
  loading: boolean;
  error: string;
  fetchFaqs: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  sendPrompt: (prompt: string, faqId?: number) => Promise<string>;
  setRole: (role: string) => void; // ✅ helper to set role name
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    null
  );
}

export const useAiStore = create<AiStore>((set) => ({
  faqs: [],
  history: [],
  role: undefined,
  loading: false,
  error: '',

  setRole: (role: string) => set({ role }),

  fetchFaqs: async () => {
    set({ loading: true, error: '' });
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required. Please log in.');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await listAiFaqs(headers);
      const faqs = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      // ✅ normalize role to string
      const normalized = faqs.map((faq: any) => ({
        ...faq,
        answer: typeof faq.answer === 'string' ? faq.answer : JSON.stringify(faq.answer),
        role: typeof faq.role === 'string' ? faq.role : faq.role?.name ?? '', 
      }));

      set({ faqs: normalized, loading: false });
    } catch (err: any) {
      console.error('[fetchFaqs]', err);
      set({ loading: false, error: err?.message || 'Unable to load AI FAQs.' });
    }
  },

  fetchHistory: async () => {
    set({ loading: true, error: '' });
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required. Please log in.');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await listAiInteractions(headers);
      const history = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      const normalized = history.map((item: any) => ({
        ...item,
        answer:
          typeof item.answer === 'string'
            ? item.answer
            : item?.data?.answer ?? JSON.stringify(item.answer),
      }));
      set({ history: normalized, loading: false });
    } catch (err: any) {
      console.error('[fetchHistory]', err);
      set({ loading: false, error: err?.message || 'Unable to load AI history.' });
    }
  },

  sendPrompt: async (prompt: string, faqId?: number): Promise<string> => {
    set({ loading: true, error: '' });
    try {
      const token = await getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      console.log('sendPrompt called with:', prompt, 'faqId:', faqId);
      const response = await queryAi({ prompt, faq_id: faqId }, headers);
      console.log('queryAi raw response:', response);

      const raw = response?.data?.response;
      let parsed: any = null;

      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        console.error('Failed to parse AI response string:', raw);
      }

      const answer =
        parsed?.data?.answer ??
        parsed?.message ??
        response?.data?.data?.answer ??
        response?.data?.answer ??
        response?.data?.message ??
        '';

      if (!answer) throw new Error('Empty response from AI.');

      const interaction: AiInteraction = {
        id: Date.now(),
        prompt,
        answer,
        status: 'completed',
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        history: [interaction, ...state.history],
        loading: false,
      }));

      return answer;
    } catch (err: any) {
      console.error('[sendPrompt]', err);
      set({ loading: false, error: err?.message || 'Unable to send prompt.' });
      throw err;
    }
  },
}));

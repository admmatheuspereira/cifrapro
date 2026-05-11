import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Cifra, Hinario, UserProfile } from "../types";

interface AppState {
  cifras: Cifra[];
  hinarios: Hinario[];
  profile: UserProfile;

  addCifra: (cifra: Omit<Cifra, "id" | "createdAt" | "updatedAt">) => void;
  updateCifra: (id: string, cifra: Partial<Cifra>) => void;
  deleteCifra: (id: string) => void;

  addHinario: (name: string) => void;
  deleteHinario: (id: string) => void;

  addCifraToHinario: (hinarioId: string, cifraId: string) => void;
  removeCifraFromHinario: (hinarioId: string, cifraId: string) => void;

  updateProfile: (profile: Partial<UserProfile>) => void;
  importData: (cifras: Cifra[], hinarios: Hinario[]) => void;
  resetAllData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      cifras: [],
      hinarios: [],
      profile: { name: "", photoUrl: null, theme: "dark" },

      addCifra: (cifraData) => set((state) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const newCifra: Cifra = {
          ...cifraData,
          id,
          createdAt: now,
          updatedAt: now
        };
        return { cifras: [newCifra, ...state.cifras] };
      }),

      updateCifra: (id, updates) => set((state) => ({
        cifras: state.cifras.map(c =>
          c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
        )
      })),

      deleteCifra: (id) => set((state) => ({
        cifras: state.cifras.filter(c => c.id !== id),
        hinarios: state.hinarios.map(h => ({
          ...h,
          cifraIds: h.cifraIds.filter(cid => cid !== id)
        }))
      })),

      addHinario: (name) => set((state) => {
        const newHinario: Hinario = {
          id: crypto.randomUUID(),
          name,
          cifraIds: [],
          createdAt: Date.now()
        };
        return { hinarios: [newHinario, ...state.hinarios] };
      }),

      deleteHinario: (id) => set((state) => ({
        hinarios: state.hinarios.filter(h => h.id !== id)
      })),

      addCifraToHinario: (hinarioId, cifraId) => set((state) => ({
        hinarios: state.hinarios.map(h =>
          h.id === hinarioId && !h.cifraIds.includes(cifraId)
            ? { ...h, cifraIds: [...h.cifraIds, cifraId] }
            : h
        )
      })),

      removeCifraFromHinario: (hinarioId, cifraId) => set((state) => ({
        hinarios: state.hinarios.map(h =>
          h.id === hinarioId
            ? { ...h, cifraIds: h.cifraIds.filter(id => id !== cifraId) }
            : h
        )
      })),

      updateProfile: (updates) => set((state) => ({
        profile: { ...state.profile, ...updates }
      })),

      importData: (cifras, hinarios) => set((state) => {
        const existingCifraIds = new Set(state.cifras.map(c => c.id));
        const newCifras = cifras.filter(c => !existingCifraIds.has(c.id));

        const existingHinarioIds = new Set(state.hinarios.map(h => h.id));
        const newHinarios = hinarios.filter(h => !existingHinarioIds.has(h.id));

        return {
          cifras: [...state.cifras, ...newCifras],
          hinarios: [...state.hinarios, ...newHinarios]
        };
      }),

      resetAllData: () => set(() => ({
        cifras: [],
        hinarios: [],
        profile: { name: "", photoUrl: null, theme: "dark" }
      }))
    }),
    {
      name: "cifrapro-data"
    }
  )
);

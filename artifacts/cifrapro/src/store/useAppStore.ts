import { create } from "zustand";
import { Cifra, Hinario, UserProfile } from "../types";
import { supabase } from "../lib/supabase";

interface AppState {
  cifras: Cifra[];
  hinarios: Hinario[];
  profile: UserProfile;

  loadFromSupabase: (userId: string) => Promise<void>;
  clearData: () => void;

  addCifra: (cifra: Omit<Cifra, "id" | "createdAt" | "updatedAt">) => Promise<Cifra | undefined>;
  updateCifra: (id: string, cifra: Partial<Cifra>) => Promise<void>;
  deleteCifra: (id: string) => Promise<void>;

  addHinario: (name: string) => Promise<void>;
  deleteHinario: (id: string) => Promise<void>;

  addCifraToHinario: (hinarioId: string, cifraId: string) => Promise<void>;
  removeCifraFromHinario: (hinarioId: string, cifraId: string) => Promise<void>;

  updateProfile: (profile: Partial<UserProfile>) => void;
  importData: (cifras: Cifra[], hinarios: Hinario[], profile?: Partial<UserProfile>) => Promise<void>;
  resetAllData: () => Promise<void>;
}

function rowToCifra(row: any): Cifra {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    key: row.key,
    content: row.content,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function rowToHinario(row: any): Hinario {
  return {
    id: row.id,
    name: row.name,
    cifraIds: row.cifra_ids ?? [],
    createdAt: new Date(row.created_at).getTime(),
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

export const useAppStore = create<AppState>()((set, get) => ({
  cifras: [],
  hinarios: [],
  profile: { name: "", photoUrl: null, theme: "dark", notifNews: false, notifTips: false },

  loadFromSupabase: async (userId: string) => {
    const [cifrasRes, hinariosRes, profileRes] = await Promise.all([
      supabase.from("cifras").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("hinarios").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
    ]);

    const cifras = (cifrasRes.data ?? []).map(rowToCifra);
    const hinarios = (hinariosRes.data ?? []).map(rowToHinario);
    const profileRow = profileRes.data;

    set({
      cifras,
      hinarios,
      profile: profileRow
        ? {
            name: profileRow.name ?? "",
            photoUrl: profileRow.photo_url ?? null,
            theme: profileRow.theme ?? "dark",
            notifNews: profileRow.notif_news ?? false,
            notifTips: profileRow.notif_tips ?? false,
          }
        : { name: "", photoUrl: null, theme: "dark", notifNews: false, notifTips: false },
    });
  },

  clearData: () => set({ cifras: [], hinarios: [], profile: { name: "", photoUrl: null, theme: "dark", notifNews: false, notifTips: false } }),

  addCifra: async (cifraData) => {
    const userId = await getCurrentUserId();
    if (!userId) return undefined;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const nowTs = Date.now();

    const { error } = await supabase.from("cifras").insert({
      id,
      user_id: userId,
      title: cifraData.title,
      artist: cifraData.artist,
      key: cifraData.key,
      content: cifraData.content,
      created_at: now,
      updated_at: now,
    });

    if (!error) {
      const newCifra: Cifra = { ...cifraData, id, createdAt: nowTs, updatedAt: nowTs };
      set((state) => ({ cifras: [newCifra, ...state.cifras] }));
      return newCifra;
    }
    return undefined;
  },

  updateCifra: async (id, updates) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const now = new Date().toISOString();
    const nowTs = Date.now();

    const supabaseUpdates: any = { updated_at: now };
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.artist !== undefined) supabaseUpdates.artist = updates.artist;
    if (updates.key !== undefined) supabaseUpdates.key = updates.key;
    if (updates.content !== undefined) supabaseUpdates.content = updates.content;

    const { error } = await supabase
      .from("cifras")
      .update(supabaseUpdates)
      .eq("id", id)
      .eq("user_id", userId);

    if (!error) {
      set((state) => ({
        cifras: state.cifras.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: nowTs } : c
        ),
      }));
    }
  },

  deleteCifra: async (id) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("cifras")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (!error) {
      // Capture affected hinarios BEFORE updating local state
      const affectedHinarios = get().hinarios.filter((h) => h.cifraIds.includes(id));

      set((state) => ({
        cifras: state.cifras.filter((c) => c.id !== id),
        hinarios: state.hinarios.map((h) => ({
          ...h,
          cifraIds: h.cifraIds.filter((cid) => cid !== id),
        })),
      }));

      for (const h of affectedHinarios) {
        const newIds = h.cifraIds.filter((cid) => cid !== id);
        await supabase
          .from("hinarios")
          .update({ cifra_ids: newIds })
          .eq("id", h.id)
          .eq("user_id", userId);
      }
    }
  },

  addHinario: async (name) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const nowTs = Date.now();

    const { error } = await supabase.from("hinarios").insert({
      id,
      user_id: userId,
      name,
      cifra_ids: [],
      created_at: now,
    });

    if (!error) {
      const newHinario: Hinario = { id, name, cifraIds: [], createdAt: nowTs };
      set((state) => ({ hinarios: [newHinario, ...state.hinarios] }));
    }
  },

  deleteHinario: async (id) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("hinarios")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (!error) {
      set((state) => ({ hinarios: state.hinarios.filter((h) => h.id !== id) }));
    }
  },

  addCifraToHinario: async (hinarioId, cifraId) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const hinario = get().hinarios.find((h) => h.id === hinarioId);
    if (!hinario || hinario.cifraIds.includes(cifraId)) return;

    const newIds = [...hinario.cifraIds, cifraId];

    const { error } = await supabase
      .from("hinarios")
      .update({ cifra_ids: newIds })
      .eq("id", hinarioId)
      .eq("user_id", userId);

    if (!error) {
      set((state) => ({
        hinarios: state.hinarios.map((h) =>
          h.id === hinarioId ? { ...h, cifraIds: newIds } : h
        ),
      }));
    }
  },

  removeCifraFromHinario: async (hinarioId, cifraId) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const hinario = get().hinarios.find((h) => h.id === hinarioId);
    if (!hinario) return;

    const newIds = hinario.cifraIds.filter((id) => id !== cifraId);

    const { error } = await supabase
      .from("hinarios")
      .update({ cifra_ids: newIds })
      .eq("id", hinarioId)
      .eq("user_id", userId);

    if (!error) {
      set((state) => ({
        hinarios: state.hinarios.map((h) =>
          h.id === hinarioId ? { ...h, cifraIds: newIds } : h
        ),
      }));
    }
  },

  updateProfile: (updates) => {
    set((state) => ({ profile: { ...state.profile, ...updates } }));

    getCurrentUserId().then((userId) => {
      if (!userId) return;
      const profile = get().profile;
      supabase.from("profiles").upsert({
        user_id: userId,
        name: profile.name,
        photo_url: profile.photoUrl,
        theme: profile.theme,
        notif_news: profile.notifNews,
        notif_tips: profile.notifTips,
      });
    });
  },

  importData: async (cifras, hinarios, profile) => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const existingCifraIds = new Set(get().cifras.map((c) => c.id));
    const newCifras = cifras.filter((c) => !existingCifraIds.has(c.id));

    const existingHinarioIds = new Set(get().hinarios.map((h) => h.id));
    const newHinarios = hinarios.filter((h) => !existingHinarioIds.has(h.id));

    if (newCifras.length > 0) {
      await supabase.from("cifras").insert(
        newCifras.map((c) => ({
          id: c.id,
          user_id: userId,
          title: c.title,
          artist: c.artist,
          key: c.key,
          content: c.content,
          created_at: new Date(c.createdAt).toISOString(),
          updated_at: new Date(c.updatedAt).toISOString(),
        }))
      );
    }

    if (newHinarios.length > 0) {
      await supabase.from("hinarios").insert(
        newHinarios.map((h) => ({
          id: h.id,
          user_id: userId,
          name: h.name,
          cifra_ids: h.cifraIds,
          created_at: new Date(h.createdAt).toISOString(),
        }))
      );
    }

    set((state) => ({
      cifras: [...state.cifras, ...newCifras],
      hinarios: [...state.hinarios, ...newHinarios],
      ...(profile ? { profile: { ...state.profile, ...profile } } : {}),
    }));
  },

  resetAllData: async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await Promise.all([
      supabase.from("cifras").delete().eq("user_id", userId),
      supabase.from("hinarios").delete().eq("user_id", userId),
      supabase.from("profiles").delete().eq("user_id", userId),
    ]);

    set({ cifras: [], hinarios: [], profile: { name: "", photoUrl: null, theme: "dark", notifNews: false, notifTips: false } });
  },
}));

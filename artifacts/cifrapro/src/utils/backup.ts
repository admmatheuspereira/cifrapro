import { Cifra, Hinario } from "../types";

export const encodeBackup = (cifras: Cifra[], hinarios: Hinario[]): string => {
  const data = JSON.stringify({ cifras, hinarios });
  return btoa(unescape(encodeURIComponent(data)));
};

export const decodeBackup = (encoded: string): { cifras: Cifra[], hinarios: Hinario[] } | null => {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed.cifras) && Array.isArray(parsed.hinarios)) {
      return {
        cifras: parsed.cifras,
        hinarios: parsed.hinarios
      };
    }
  } catch (err) {
    console.error("Failed to decode backup", err);
  }
  return null;
};

export const downloadJson = (cifras: Cifra[], hinarios: Hinario[]): void => {
  const data = JSON.stringify({ cifras, hinarios }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `cifrapro-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateShareLink = (cifras: Cifra[], hinarios: Hinario[]): string => {
  const encoded = encodeBackup(cifras, hinarios);
  return `${window.location.origin}?data=${encoded}`;
};

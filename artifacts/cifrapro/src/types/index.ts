export interface Cifra {
  id: string;
  title: string;
  artist: string;
  key: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Hinario {
  id: string;
  name: string;
  cifraIds: string[];
  createdAt: number;
}

export interface UserProfile {
  name: string;
  photoUrl: string | null;
  theme: "dark" | "light";
}

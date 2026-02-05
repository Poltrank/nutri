
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { AuthUser, Suggestion } from "../types";

// Suas credenciais oficiais do projeto meunutri-e01f2
const firebaseConfig = {
  apiKey: "AIzaSyCLD9gYolkf8E7y645Hv95jhM0SV0i_ihE",
  authDomain: "meunutri-e01f2.firebaseapp.com",
  projectId: "meunutri-e01f2",
  storageBucket: "meunutri-e01f2.firebasestorage.app",
  messagingSenderId: "736395270611",
  appId: "1:736395270611:web:756259d95bcad35d6eb726",
  measurementId: "G-8B7VPJ4QJ6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Sincroniza os dados do usuário com a nuvem
export const syncUserToCloud = async (user: AuthUser) => {
  if (!user.id) return;
  try {
    const userRef = doc(db, "users", user.id);
    const { password, ...safeData } = user;
    await setDoc(userRef, safeData, { merge: true });
  } catch (e) {
    console.error("Erro ao sincronizar com Firebase:", e);
  }
};

export const getUserFromCloud = async (userId: string): Promise<AuthUser | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data() as AuthUser) : null;
  } catch (e) {
    console.error("Erro ao buscar usuário no Firebase:", e);
    return null;
  }
};

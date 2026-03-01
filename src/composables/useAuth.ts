import { ref } from "vue";
import { auth, db, googleProvider } from "../../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { ADMINS_DB } from "./constants";

const user = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

export function useAuth() {
  const checkIfUserIsAdmin = async (user: any) => {
    const usersRef = collection(db, ADMINS_DB);
    const snapshot = await getDocs(usersRef);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const findedUser = users.find((u: any) => u?.email === user?.email);

    return !!findedUser;
  };

  const signInWithGoogle = async () => {
    try {
      error.value = null;
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      error.value = err.message;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      user.value = null;
    } catch (err: any) {
      error.value = err.message;
    }
  };

  onAuthStateChanged(auth, async (u) => {
    const isAdmin = await checkIfUserIsAdmin(u);
    if (!isAdmin) {
      logout();
    } else {
      user.value = u;
    }

    loading.value = false;
  });

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    logout,
  };
}

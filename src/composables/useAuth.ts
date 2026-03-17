import { ref, computed } from "vue";
import { auth, db, googleProvider } from "../../firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ADMINS_DB } from "./constants";

const user = ref<User | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onAuthStateChanged(auth, async (firebaseUser) => {
  loading.value = true;

  if (firebaseUser) {
    const isAdmin = await checkIfUserIsAdmin(firebaseUser);
    if (isAdmin) {
      user.value = firebaseUser;
    } else {
      await signOut(auth);
      user.value = null;
      error.value = "წვდომა უარყოფილია: თქვენ არ ხართ ადმინისტრატორი";
    }
  } else {
    user.value = null;
  }

  loading.value = false;
});

async function checkIfUserIsAdmin(u: User | null) {
  if (!u?.email) return false;
  try {
    const usersRef = collection(db, ADMINS_DB);
    const q = query(usersRef, where("email", "==", u.email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (err) {
    console.error("Admin check failed", err);
    return false;
  }
}

export function useAuth() {
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

  return {
    user,
    fullName: computed(() => user.value?.displayName || "ანონიმი"),
    profileImg: computed(() => user.value?.photoURL),
    loading,
    error,
    signInWithGoogle,
    logout,
  };
}

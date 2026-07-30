import { ref, computed } from "vue";
import { auth, db, googleProvider } from "../../firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { USERS_DB } from "./constants";
import { UserRole } from "../type/interfaces";

const user = ref<User | null>(null);
const role = ref<UserRole | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onAuthStateChanged(auth, async (firebaseUser) => {
  loading.value = true;

  if (firebaseUser) {
    role.value = await resolveUserRole(firebaseUser);
    user.value = firebaseUser;
  } else {
    user.value = null;
    role.value = null;
  }

  loading.value = false;
});

async function resolveUserRole(u: User): Promise<UserRole> {
  const usersRef = collection(db, USERS_DB);

  const uidDocRef = doc(db, USERS_DB, u.uid);
  const uidDoc = await getDoc(uidDocRef);
  if (uidDoc.exists()) {
    return uidDoc.data().role as UserRole;
  }

  const q = query(usersRef, where("email", "==", u.email));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0]!.data().role as UserRole;
  }

  await setDoc(uidDocRef, {
    email: u.email,
    name: u.displayName || u.email,
    role: UserRole.USER,
    avatar_url: u.photoURL || "",
  });
  return UserRole.USER;
}

export function useAuth() {
  const { appUsers, groups } = storeToRefs(useGlobalStore());

  const avatarUrl = computed(() => {
    if (!user.value?.email) return null;
    return appUsers.value.find((u) => u.email === user.value!.email)?.avatar_url ?? null;
  });

  const currentAppUser = computed(() =>
    user.value?.email
      ? appUsers.value.find((u) => u.email === user.value!.email) ?? null
      : null,
  );

  const userGroupName = computed(() => {
    const me = currentAppUser.value;
    if (!me) return "";
    return (
      groups.value.find((g) => g.leader_id === me.id || g.leader === me.name)
        ?.name ?? ""
    );
  });

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
      role.value = null;
    } catch (err: any) {
      error.value = err.message;
    }
  };

  return {
    user,
    role,
    avatarUrl,
    isAdmin: computed(() => role.value === UserRole.ADMIN),
    isLoggedIn: computed(() => !!user.value),
    fullName: computed(() => currentAppUser.value?.name ?? ""),
    userId: computed(() => currentAppUser.value?.id ?? ""),
    userGroupName,
    profileImg: computed(() => user.value?.photoURL),
    loading,
    error,
    signInWithGoogle,
    logout,
  };
}

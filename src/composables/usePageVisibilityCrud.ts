import { storeToRefs } from "pinia";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useGlobalStore } from "@/stores/GlobalStore";
import { PAGE_VISIBILITY_DB } from "./constants";

export const PAGE_DEFINITIONS = [
  { key: "announcements", label: "განცხადებები", icon: "pi pi-megaphone" },
  { key: "groups", label: "ჯგუფები", icon: "pi pi-users" },
  { key: "clubs", label: "წრეები", icon: "pi pi-sparkles" },
  { key: "day_schedule", label: "დღის განრიგი", icon: "pi pi-calendar" },
  { key: "evening_schedule", label: "საღამოს პროგრამა", icon: "pi pi-moon" },
  { key: "events", label: "ნომრები", icon: "pi pi-ticket" },
  { key: "golden_verses", label: "ოქროს მუხლები", icon: "pi pi-lightbulb" },
];

export function usePageVisibilityCrud() {
  const store = useGlobalStore();
  const { pageVisibilities, loading } = storeToRefs(store);

  const isVisible = (key: string): boolean => {
    const pv = pageVisibilities.value.find((p) => p.id === key);
    return pv ? pv.is_visible : true;
  };

  const toggleVisibility = async (key: string) => {
    const current = isVisible(key);
    await setDoc(doc(db, PAGE_VISIBILITY_DB, key), { is_visible: !current }, { merge: true });
  };

  return { pageVisibilities, isVisible, toggleVisibility, loading };
}

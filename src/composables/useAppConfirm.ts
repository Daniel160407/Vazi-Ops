import { ref } from "vue";

interface ConfirmOptions {
  message: string;
  header: string;
  acceptLabel: string;
  rejectLabel: string;
  accept: () => void | Promise<void>;
}

const visible = ref(false);
const options = ref<ConfirmOptions | null>(null);

export function useAppConfirm() {
  const require = (opts: ConfirmOptions) => {
    options.value = opts;
    visible.value = true;
  };

  const close = () => {
    visible.value = false;
    options.value = null;
  };

  return { visible, options, require, close };
}

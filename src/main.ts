import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import router from "./composables/router";
import Noir from "./presets/Noir";

import "./style.css";
import "primeicons/primeicons.css";

import App from "./App.vue";
import { ToastService, Tooltip } from "primevue";

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Noir,
    options: {
      prefix: "p",
      darkModeSelector: "system",
      cssLayer: false,
    },
  },
});

app.use(createPinia());
app.use(ConfirmationService);
app.use(router);
app.use(ToastService);

app.directive("tooltip", Tooltip);

app.mount("#app");

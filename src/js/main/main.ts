import App from "./main.svelte";
import { initBolt } from "../lib/utils/bolt";

console.log(import.meta.env.VITE_CODA_TOKEN);
console.group(import.meta.env);
initBolt();

const app = new App({
  target: document.getElementById("root") as Element,
});

export default app;

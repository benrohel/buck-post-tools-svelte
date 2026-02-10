import CSInterface from "@/lib/cep/csinterface";
import { logModule } from "@/lib/logger";
const csInterface = new CSInterface();
const log = logModule('capture-keys');

const defaultKeys = [
  { keyCode: 37 }, { keyCode: 38 }, { keyCode: 39 }, { keyCode: 40 },
  { keyCode: 8 }, { keyCode: 46 },
  { keyCode: 65, ctrlKey: true }, { keyCode: 67, ctrlKey: true },
  { keyCode: 86, ctrlKey: true }, { keyCode: 88, ctrlKey: true },
  { keyCode: 90, ctrlKey: true }
];

export function captureKeys(node: HTMLElement, keys = defaultKeys) {
  log.debug("Capture keys", { node, keys });
  const disable = () => csInterface.registerKeyEventsInterest(JSON.stringify(keys));
  const enable = () => csInterface.registerKeyEventsInterest(JSON.stringify([]));

  node.addEventListener('focus', disable);
  node.addEventListener('blur', enable);

  return {
    update(newKeys: any) {
      keys = newKeys;
    },
    destroy() {
      node.removeEventListener('focus', disable);
      node.removeEventListener('blur', enable);
      enable();
    }
  };
}
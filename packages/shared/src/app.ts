import { AppConfig } from "./config";

interface Application<TConfig = AppConfig> {
  name: string;
  version: string;
  env?: AppConfig;
  setup: () => void;
  run: () => void;
  config: () => TConfig;
  onConfig: (callback: (config: TConfig) => void) => void;
  onRun: (callback: () => void) => void;
}

export default Application;

import Application from "packages/shared/src/app";
import { AppConfig, Environment } from "shared";

export class ExpressApp implements Application {
  name: string;
  version: string;

  private configObj: AppConfig;
  private configCallbacks: Array<(config: AppConfig) => void> = [];
  private runCallbacks: Array<() => void> = [];

  constructor(config: AppConfig) {
    this.configObj = config;
    const currentEnv = this.getDeploymentConfigEnv();

    this.name = currentEnv?.variables.NAME.toString() ?? "ExpressApp";
    this.version = currentEnv?.variables.VERSION.toString() ?? "1.0.0";
  }

  //get deployment config env
  getDeploymentConfigEnv = () => {
    return this.configObj.env?.find(e => e.name === this.configObj.deploymentStage);
  }

  setup = () => {
    this.configCallbacks.forEach(cb => cb(this.configObj));
  };

  run = () => {
    this.runCallbacks.forEach(cb => cb());
    console.log(`Running ${this.name} version ${this.version}`);
  };

  config = (): AppConfig => {
    return this.configObj;
  };

  onConfig = (callback: (config: AppConfig) => void): void => {
    this.configCallbacks.push(callback);
  };

  onRun = (callback: () => void): void => {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }

    this.runCallbacks.push(callback);
  };
}

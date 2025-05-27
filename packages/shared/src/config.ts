import { Environment, EnvironmentType } from "./utils";

export interface AppConfig {
  port: number;
  host?: string;
  env?: Environment[];
  deploymentStage: EnvironmentType;
  middlewares?: any[]; // Names or paths to middleware
  routes?: Array<{
    path: string;
    method: string;
    handler: any; // Handler identifier or path
  }>;
  // Allow extension for other frameworks or custom config
  [key: string]: any;
}

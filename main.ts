import { ExpressApp } from "./apps/express-app/src";
import { AppConfig, EnvironmentType } from "./packages/shared/src";

const appConfig: AppConfig = {
  port: 3000,
  deploymentStage: EnvironmentType.Development,
  env: [
    {
      name: EnvironmentType.Development,
      variables: {
        // General
        NAME: "Express Application",
        VERSION: "1.0.0",
        // Environment
        NODE_ENV: "development",
        TZ: "Asia/colombo",
        PORT: 3000,
        HOST: "localhost",
        JWT_SECRET: "your_jwt_secret",
        API_URL_PREFIX: "api",

        // mysql
        MYSQL_HOST: "localhost",
        MYSQL_PORT: 3306,
        MYSQL_DATABASE: "myapp",
        MYSQL_USER: "root",
        MYSQL_PASSWORD: "password"
      }
    }
  ],
};
const expressApp = new ExpressApp(appConfig);
expressApp.run();

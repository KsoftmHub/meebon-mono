export const getAppPackageJsonTemplate = (appName: string): string => `{
  "name": "${appName}",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "echo 'Starting ${appName} (dev mode)' && tsc --watch & node dist/index.js",
    "lint": "echo 'Running lint for ${appName}' && exit 0",
    "test": "echo 'Running test for ${appName}' && exit 0"
  },
  "dependencies": {
    "shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "latest"
  }
}
`;

export const getPackagePackageJsonTemplate = (packageName: string): string => `{
  "name": "${packageName}",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "echo 'Running lint for ${packageName}' && exit 0",
    "test": "echo 'Running test for ${packageName}' && exit 0"
  },
  "devDependencies": {
    "typescript": "latest"
  }
}
`;

export const getAppTsConfigTemplate = (): string => `{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "lib": ["es2019"],
    "module": "commonjs",
    "composite": true
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/shared" }
  ]
}
`;

export const getPackageTsConfigTemplate = (): string => `{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "lib": ["es2019"],
    "module": "commonjs",
    "declaration": true,
    "composite": true
  },
  "include": ["src"]
}
`;

export const getAppIndexTsTemplate = (appName: string): string => `import "shared";

console.log('${appName} Service Starting...');

// Your ${appName} service logic would go here
`;

export const getPackageIndexTsTemplate = (packageName: string): string => `// ${packageName} package entry point

export const greet = (name: string): string => {
  return \`Hello, \${name}! from ${packageName}\`;
};

console.log('${packageName} package loaded.');
`;

export const getGitignoreTemplate = (): string => `# Build output
dist/

# TypeScript build info
*.tsbuildinfo

# Local dependencies (already covered by root .gitignore, but good practice)
node_modules/
`;

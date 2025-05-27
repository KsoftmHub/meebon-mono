enum EnvironmentType {
  Development = 'development',
  Production = 'production',
  Testing = 'testing',
  Staging = 'staging',
}

interface Environment {
  name: EnvironmentType;
  variables: Record<string, string | number | boolean>;
}

export { Environment, EnvironmentType };

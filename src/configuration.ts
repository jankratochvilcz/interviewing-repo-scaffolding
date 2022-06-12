import { GitHubConfiguration } from "./github";

export const getGitHubConfiguration = (): GitHubConfiguration => ({
  defaultBranch: getRequiredEnvironmentVariable("DEFAULT_BRANCH"),
  organization: getRequiredEnvironmentVariable("ORGANIZATION_NAME"),
  token: getRequiredEnvironmentVariable("GITHUB_TOKEN"),
});

const getRequiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} cannot be empty.`);
  }

  return value;
};

import { GitHubConfiguration } from "./github";

export const defaultBranchEnvironmentVariable = "DEFAULT_BRANCH";
export const organizationNameEnvironmentVariable = "ORGANIZATION_NAME";
export const gitHubTokenEnvironmentVariable = "GITHUB_TOKEN";

export const getGitHubConfiguration = (): GitHubConfiguration => ({
  defaultBranch: getRequiredEnvironmentVariable(
    defaultBranchEnvironmentVariable
  ),
  organization: getRequiredEnvironmentVariable(
    organizationNameEnvironmentVariable
  ),
  token: getRequiredEnvironmentVariable(gitHubTokenEnvironmentVariable),
});

const getRequiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} cannot be empty.`);
  }

  return value;
};

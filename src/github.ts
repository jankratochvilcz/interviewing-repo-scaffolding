import { Octokit } from "@octokit/rest";
import { IssueTemplate, PullTemplate } from "./templates";

export type GitHubConfiguration = {
  token: string;
  organization: string;
  defaultBranch: string;
};

const getClient = (configuration: GitHubConfiguration) =>
  new Octokit({
    auth: configuration.token,
  });

export const createRepo = async (
  name: string,
  configuration: GitHubConfiguration
): Promise<{ url: string }> => {
  const client = getClient(configuration);

  const createdRepo = await client.repos.createForAuthenticatedUser({
    org: configuration.organization,
    name,
    has_issues: true,
  });

  return {
    url: createdRepo.data.ssh_url,
  };
};

export const createIssue = async (
  template: IssueTemplate,
  repo: string,
  configuration: GitHubConfiguration
) => {
  const client = getClient(configuration);
  const issue = await client.issues.create({
    owner: configuration.organization,
    repo: repo,
    title: template.title,
    body: template.content,
  });

  return issue;
};

export const createPull = async (
  template: PullTemplate,
  repo: string,
  configuration: GitHubConfiguration
) => {
  const client = getClient(configuration);
  const issue = await client.pulls.create({
    owner: configuration.organization,
    repo: repo,
    title: template.title,
    body: template.content,
    base: configuration.defaultBranch,
    head: template.branch,
  });

  return issue;
};

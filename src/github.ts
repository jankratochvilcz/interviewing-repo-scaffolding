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
    userAgent: "Interviewing Repo Scaffolding",
    baseUrl: "https://api.github.com",
  });

export const createRepo = async (
  name: string,
  configuration: GitHubConfiguration
) => {
  const client = getClient(configuration);
  
  await client.repos.createInOrg({
    org: configuration.organization,
    name,
  });

  const repoWithUpdatedDefaultBranch = await client.repos.update({
    repo: name,
    owner: configuration.organization,
    default_branch: configuration.defaultBranch,
  })

  return repoWithUpdatedDefaultBranch;
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
    head: template.branch
  });

  return issue;
};

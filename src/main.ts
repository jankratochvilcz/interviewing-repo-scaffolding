import { getGitHubConfiguration } from "./configuration";
import { copyFolderRecursiveSync, getTemplateFiles, mkdir } from "./filesystem";
import {
  createIssue,
  createPull,
  createRepo,
  GitHubConfiguration,
} from "./github";
import { parseTemplate } from "./templates";
import dotenv from "dotenv";
import { executeWithGitInRepo } from "./git";

const remoteName = "origin";

let stepNumber = 1

const executeStep = async <TOutput>(
  name: string,
  toExecute: () => Promise<TOutput>
): Promise<TOutput> => {
  const stepPrefix = `[${stepNumber}] ${name}: `
  console.log(`${stepPrefix} Started.`);
  const result = await toExecute();
  console.log(`${stepNumber} Finished.`);
  console.log();

  stepNumber++

  return result;
};

const main = async (candidateUsername: string) => {
  await executeStep("Moving source to build folder", () => {
    mkdir("build/src");
    copyFolderRecursiveSync("templates", "build");

    return Promise.resolve(true);
  });

  const configuration = await executeStep("Getting configuration", () =>
    Promise.resolve(getGitHubConfiguration())
  );
  const repoWithOrg = `Creating repository ${configuration.organization}/${candidateUsername}`;

  const { url, htmlUrl } = await executeStep(
    repoWithOrg,
    async () => await createRepo(candidateUsername, configuration)
  );

  await executeStep(
    `Pushing current branch to ${repoWithOrg}/${configuration.defaultBranch}`,
    async () => {
      await executeWithGitInRepo(["init"]);
      await executeWithGitInRepo(["remote", "add", remoteName, url]);
      await executeWithGitInRepo(["add", "-A"]);
      await executeWithGitInRepo(["commit", "-m", "Initial commit"]);

      await executeWithGitInRepo([
        "push",
        "origin",
        `master:${configuration.defaultBranch}`,
      ]);
    }
  );

  const templates = await executeStep("Loading templates", () =>
    Promise.resolve(
      getTemplateFiles().map(({ content }) => parseTemplate(content))
    )
  );

  await executeStep(
    `Creating ${templates.length} issues/PRs from templates`,
    async () => await createIsses(templates, candidateUsername, configuration)
  );

  console.log(`Done! See repo at ${htmlUrl}`);
};

const createIsses = async (
  templates: import("/Users/jan/src/personal/interviewing-repo-scaffolding/src/templates").Template[],
  candidateUsername: string,
  configuration: GitHubConfiguration
) => {
  for (const template of templates) {
    const { branch } = template;

    switch (template.type) {
      case "issue":
        await createIssue(template, candidateUsername, configuration);
        break;
      case "pull_request":
        if (!branch) {
          throw new Error("Branch parameter is required for pull requests");
        }
        await createPull(
          {
            ...template,
            branch,
          },
          candidateUsername,
          configuration
        );
        break;
      default:
        break;
    }
  }
};

dotenv.config();

void main("testrepo");

import { getGitHubConfiguration } from "./configuration";
import { clearFolderRecursive, copyFolderRecursiveSync, getTemplateFiles, mkdir } from "./filesystem";
import {
  createIssue,
  createPull,
  createRepo,
  GitHubConfiguration,
} from "./github";
import { IssueTemplate, parseTemplate, PullTemplate, Template } from "./templates";
import dotenv from "dotenv";
import { executeWithGitInRepo } from "./git";

const remoteName = "origin";

let stepNumber = 1;

const executeStep = async <TOutput>(
  name: string,
  toExecute: () => Promise<TOutput>
): Promise<TOutput> => {
  const stepPrefix = `[${stepNumber}] ${name}: `;
  console.log(`${stepPrefix} Started.`);
  const result = await toExecute();
  console.log(`${stepNumber} Finished.`);
  console.log();

  stepNumber++;

  return result;
};

const main = async (candidateUsername: string) => {
  const diff = await executeStep(
    "Checking local repository",
    async () => await executeWithGitInRepo(["diff", "HEAD"], "main")
  );

  if (diff.isError || diff.message.length > 0) {
    console.log("Working tree is dirty. Clean working tree and try again.");
    return;
  }

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

  const issues = templates.filter(x => x.type === "issue")

  await executeStep(
    `Creating ${issues.length} issues from templates`,
    async () => await createIsses(issues, candidateUsername, configuration)
  );

  const pulls = templates.filter(x => x.type === "pull_request")

  await executeStep(
    `Pushing ${pulls.length} PR branches to origin`,
    async () => {
      for (const pull of pulls) {
        const { branch, title } = pull as PullTemplate

        console.log(`${branch} [${title}]`)

        clearFolderRecursive("build/templates/src")

        await executeWithGitInRepo(["init"]);
        await executeWithGitInRepo(["remote", "add", remoteName, url]);
        await executeWithGitInRepo(["checkout", "-b", branch], "templates")
        await executeWithGitInRepo(["checkout", branch], "main")

        copyFolderRecursiveSync("templates/src", "build/templates")

        const addResult = await executeWithGitInRepo(["add", "-A"], "templates")

        if(addResult.isError) {
          console.log(addResult.error)
        }

        if(!addResult.isError) {
          console.log(addResult.message)
        }

        const commitResult = await executeWithGitInRepo(["commit", "-m", title], "templates")

        if(commitResult.isError) {
          console.log(commitResult.error)
        }

        if(!commitResult.isError) {
          console.log(commitResult.message)
        }

        const pushResult = await executeWithGitInRepo(["push", "-u", "origin", branch], "templates")

        if(pushResult.isError) {
          console.log(pushResult.error)
        }

        if(!pushResult.isError) {
          console.log(pushResult.message)
        }

        await executeWithGitInRepo(["checkout", configuration.defaultBranch], "main")
      }
    }
  )

  console.log(`Done! See repo at ${htmlUrl}`);
};

const createIsses = async (
  templates: Template[],
  candidateUsername: string,
  configuration: GitHubConfiguration
) => {
  for (const template of templates) {
    const { branch } = template;

    switch (template.type) {
      case "issue":
        await createIssue(template as IssueTemplate, candidateUsername, configuration);
        break;
      case "pull_request":
        if (!branch) {
          throw new Error("Branch parameter is required for pull requests");
        }
        await createPull(
          {
            ...template as PullTemplate,
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

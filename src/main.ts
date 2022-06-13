import { getGitHubConfiguration } from "./configuration";
import readline from "readline";
import {
  clearFolderRecursive,
  copyFolderRecursive,
  getTemplateFiles,
  localPaths,
  mkdir,
} from "./filesystem";
import {
  createIssue,
  createPull,
  createRepo,
  GitHubConfiguration,
} from "./github";
import {
  IssueTemplate,
  parseTemplate,
  PullTemplate,
  Template,
} from "./templates";
import dotenv from "dotenv";
import { executeWithGitInRepo } from "./git";
import path from "path";

const remoteName = "origin";

let stepNumber = 1;

const executeWorkflowStep = async <TOutput>(
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

const createRepoWorkflow = async (candidateUsername: string) => {
  const diff = await executeWorkflowStep(
    "Checking local repository",
    async () => await executeWithGitInRepo(["diff", "HEAD"], "main")
  );

  if (diff.isError || diff.message.length > 0) {
    console.log("Working tree is dirty. Clean working tree and try again.");
    return;
  }

  await executeWorkflowStep("Moving source to build folder", () => {
    mkdir(path.join(localPaths.buildFolder, localPaths.buildSrcFolder));
    copyFolderRecursive(localPaths.templatesFolder, localPaths.buildFolder);

    return Promise.resolve(true);
  });

  const configuration = await executeWorkflowStep("Getting configuration", () =>
    Promise.resolve(getGitHubConfiguration())
  );
  const repoWithOrg = `Creating repository ${configuration.organization}/${candidateUsername}`;

  const { url, htmlUrl } = await executeWorkflowStep(
    repoWithOrg,
    async () => await createRepo(candidateUsername, configuration)
  );

  await executeWorkflowStep(
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

  const templates = await executeWorkflowStep("Loading templates", () =>
    Promise.resolve(
      getTemplateFiles().map(({ content }) => parseTemplate(content))
    )
  );

  const issues = templates.filter((x) => x.type === "issue");

  await executeWorkflowStep(
    `Creating ${issues.length} issues from templates`,
    async () => await createIsses(issues, candidateUsername, configuration)
  );

  const pulls = templates
    .filter((x) => x.type === "pull_request")
    .map((x) => x as PullTemplate);

  try {
    await executeWorkflowStep(
      `Pushing ${pulls.length} PR branches to origin`,
      async () => {
        for (const pull of pulls) {
          const { branch, title } = pull;

          console.log(`${branch} [${title}]`);

          clearFolderRecursive(
            path.join(
              localPaths.buildFolder,
              localPaths.templatesFolder,
              localPaths.templatesSrcFolder
            )
          );

          await executeWithGitInRepo([
            "clone",
            `git@github.com:jankratochvilcz/${candidateUsername}.git`,
            ".",
          ]);
          await executeWithGitInRepo(["checkout", "-b", branch], "templates");
          await executeWithGitInRepo(["checkout", branch], "main");

          copyFolderRecursive(
            path.join(
              localPaths.templatesFolder,
              localPaths.templatesSrcFolder
            ),
            path.join(localPaths.buildFolder, localPaths.templatesFolder)
          );

          await executeWithGitInRepo(["add", "-A"], "templates");
          await executeWithGitInRepo(["commit", "-m", title], "templates");
          await executeWithGitInRepo(
            ["push", "-u", "origin", branch],
            "templates"
          );

          await createPull(pull, candidateUsername, configuration);
        }
      }
    );
  } finally {
    // We always want to end in main or it becomes confusing UX
    await executeWithGitInRepo(
      ["checkout", configuration.defaultBranch],
      "main"
    );
  }

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
        await createIssue(
          template as IssueTemplate,
          candidateUsername,
          configuration
        );
        break;
      case "pull_request":
        if (!branch) {
          throw new Error("Branch parameter is required for pull requests");
        }
        await createPull(
          {
            ...(template as PullTemplate),
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

const showPrompt = () => {
  const lineReader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(
    "1. [username]        Write candidate name to generate a test repo."
  );
  console.log("2. [Enter]           Terminate tool.");
  console.log();
  console.log();

  lineReader.question(": ", async (param) => {
    lineReader.close();

    if (!param) {
      return;
    }

    await createRepoWorkflow(param);

    showPrompt();
  });
};

showPrompt();

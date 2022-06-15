import path from "path";
import { Command, CommandContext } from "../command";
import { getGitHubConfiguration } from "../configuration";
import {
  mkdir,
  localPaths,
  copyFolderRecursive,
  getTemplateFiles,
  clearFolderRecursive,
} from "../filesystem";
import { defaultRemoteName, executeWithGitInRepo } from "../git";
import {
  createRepo,
  createPull,
  inviteCollaborator,
  GitHubConfiguration,
  createIssue,
} from "../github";
import {
  parseTemplate,
  PullTemplate,
  Template,
  IssueTemplate,
} from "../templates";

type CreateRepoParams = {
  username: string;
};

const execute = async (context: CommandContext<CreateRepoParams>) => {
console.log('executing...')
  const { executeStep, gitHubConfiguration, args: params } = context;
  const { username } = params;

  const diff = await executeStep(
    "Checking local repository",
    async () => await executeWithGitInRepo(["diff", "HEAD"], "main")
  );

  if (diff.isError || diff.message.length > 0) {
    console.log("Working tree is dirty. Clean working tree and try again.");
    return;
  }

  await executeStep("Moving source to build folder", () => {
    mkdir(path.join(localPaths.buildFolder, localPaths.buildSrcFolder));
    copyFolderRecursive(localPaths.templatesFolder, localPaths.buildFolder);

    return Promise.resolve(true);
  });

  const configuration = await executeStep("Getting configuration", () =>
    Promise.resolve(getGitHubConfiguration())
  );
  const repoWithOrg = `Creating repository ${configuration.organization}/${username}`;

  const { url, htmlUrl } = await executeStep(
    repoWithOrg,
    async () => await createRepo(username, gitHubConfiguration)
  );

  await executeStep(
    `Pushing current branch to ${repoWithOrg}/${configuration.defaultBranch}`,
    async () => {
      await executeWithGitInRepo(["init"]);
      await executeWithGitInRepo(["remote", "add", defaultRemoteName, url]);
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

  const issues = templates.filter((x) => x.type === "issue");

  await executeStep(
    `Creating ${issues.length} issues from templates`,
    async () => await createIsses(issues, context.args.username, configuration)
  );

  const pulls = templates
    .filter((x) => x.type === "pull_request")
    .map((x) => x as PullTemplate);

  try {
    await context.executeStep(
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
            `git@github.com:jankratochvilcz/${username}.git`,
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

          await createPull(pull, username, configuration);
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

  await executeStep(
    `Inviting ${username} to repo`,
    async () => await inviteCollaborator(username, username, configuration)
  );

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

const createRepoCommand = {
  name: "create",
  description: "Creates a new test project for a candidate",
  getArgs: (params) => ({
    username: params as string,
  }),
  args: [
    {
      name: "GitHub username",
      description: "The username of the test candidate.",
    },
  ],
  execute,
} as Command<CreateRepoParams>;

export default createRepoCommand;

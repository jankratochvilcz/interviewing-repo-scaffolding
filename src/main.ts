import { getGitHubConfiguration } from "./configuration";
import { getTemplateFiles } from "./filesystem";
import { createIssue, createPull, createRepo } from "./github";
import { parseTemplate } from "./templates";

const main = async (candidateUsername: string) => {
  const configuration = getGitHubConfiguration();
  const templates = getTemplateFiles().map(({ content }) =>
    parseTemplate(content)
  );

  await createRepo(candidateUsername, configuration);

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

void main("jankratochvilcz");

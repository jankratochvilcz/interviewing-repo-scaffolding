import { Command, CommandContext } from "../command";
import { archiveRepo } from "../github";
import { gitHubUserNameParam } from "./shared";

type ArchiveRepoParams = {
  username: string;
};

const execute = async (context: CommandContext<ArchiveRepoParams>) => {
  console.log("executing...");
  const { executeStep, gitHubConfiguration, args: params } = context;
  const { username } = params;

  const repoWithOrg = `Archiving repository ${gitHubConfiguration.organization}/${username}`;

  await executeStep(
    repoWithOrg,
    async () => await archiveRepo(username, gitHubConfiguration)
  );

  console.log("Done; repo archived!");
};

const achiveRepoCommand = {
  name: "archive",
  description: "Archives an existing repo for a candidate",
  getArgs: (params) => ({
    username: params as string,
  }),
  args: [gitHubUserNameParam],
  execute,
} as Command<ArchiveRepoParams>;

export default achiveRepoCommand;

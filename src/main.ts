import dotenv from "dotenv";
import { Command as Commander } from "commander";
import createRepoCommand from "./commands/create-repo";
import { Command, CommandContext } from "./command";
import { getGitHubConfiguration } from "./configuration";

const registerCommand = (
  program: Commander,
  command: Command<{ username: string }>
) => {
  const { description, execute, getArgs, name, args } = command;

  const programCommand = program
    .command(name)
    .description(description)
    .action((params) =>
      execute(new CommandContext(gitHubConfiguration, getArgs(params)))
    );

  for (const argument of args) {
    programCommand.argument(`<${argument.name}>`, argument.description);
  }

  return programCommand;
};

dotenv.config();

const gitHubConfiguration = getGitHubConfiguration();

const program = new Commander();
const commands = [createRepoCommand];

program
  .name("test-project-scaffolder")
  .description(
    "A CLI tool for scaffolding test project repos for user interviews"
  );

for (const command of commands) {
  registerCommand(program, command);
}

program.parse();

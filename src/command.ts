import { GitHubConfiguration } from "./github";

export type Command<TArgs> = {
  name: string;
  description: string;
  args: { name: string; description: string }[];
  getArgs: (...args: unknown[]) => TArgs;
  execute: (context: CommandContext<TArgs>) => Promise<void>;
};

export type CommandStepParams<TArgs> = {
  gitHubConfiguration: GitHubConfiguration;
  args: TArgs;
};

export type CommandStep<TArgs, TOutput> = (
  context: CommandStepParams<TArgs>
) => Promise<TOutput>;

export class CommandContext<TArgs> {
  private stepNumber = 1;

  readonly gitHubConfiguration: GitHubConfiguration;
  readonly args: TArgs;

  constructor(gitHubConfiguration: GitHubConfiguration, args: TArgs) {
    this.gitHubConfiguration = gitHubConfiguration;
    this.args = args;
  }

  executeStep = async <TOutput>(
    name: string,
    toExecute: CommandStep<TArgs, TOutput>
  ): Promise<TOutput> => {
    const stepPrefix = `[${this.stepNumber}] ${name}: `;
    console.log(`${stepPrefix} Started.`);
    const result = await toExecute({
      gitHubConfiguration: this.gitHubConfiguration,
      args: this.args,
    });
    console.log(`${this.stepNumber} Finished.`);
    console.log();

    this.stepNumber++;

    return result;
  };
}

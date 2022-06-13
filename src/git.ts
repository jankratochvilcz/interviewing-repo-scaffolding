import { GitProcess } from "dugite";
import path from "path";
import { localPaths } from "./filesystem";

export type RepositoryType = "main" | "templates";

export const executeWithGitInRepo = async (
  args: string[],
  repositoryType: RepositoryType = "templates"
): Promise<
  { error: string; isError: true } | { message: string; isError: false }
> => {
  const result = await GitProcess.exec(
    args,
    repositoryType === "templates"
      ? path.join(
          localPaths.appRoot,
          localPaths.templatesFolder,
          localPaths.templatesSrcFolder
        )
      : localPaths.appRoot
  );

  if (result.exitCode == 0) {
    return { message: result.stdout, isError: false };
  }

  console.log(`Git error when executing ${args.join(" ")}: ${result.stderr}`);

  return { error: result.stderr, isError: true };
};

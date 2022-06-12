import { GitProcess } from "dugite";
import { getCurrentModulePath } from "./filesystem";

export const executeWithGitInRepo = async (
  args: string[]
): Promise<{ error: string } | { message: string }> => {
  const result = await GitProcess.exec(
    args,
    `${getCurrentModulePath()}/templates/src`
  );

  if (result.exitCode == 0) {
    return { message: result.stdout };
  }

  return { error: result.stderr };
};

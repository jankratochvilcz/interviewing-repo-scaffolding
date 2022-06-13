import fs from "fs";
import path from "path";

export type TemplateFile = {
  name: string;
  content: string;
};

const templatesFolder = "/templates";

export const getTemplateFiles = (): TemplateFile[] => {
  const rootPath = `${getCurrentModulePath()}${templatesFolder}`;
  console.log(rootPath);
  const files = fs.readdirSync(rootPath);
  const templateFiles = files
    .map((x) => `${rootPath}/${x}`)
    .filter((x) => fs.lstatSync(x).isFile())
    .map(
      (x) =>
        ({
          name: x,
          content: fs.readFileSync(x, "utf-8"),
        } as TemplateFile)
    );

  return templateFiles;
};

export const getCurrentModulePath = (): string => __dirname;

// Taken from https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js with minor TS and stylistic edits.
export const copyFile = (source: string, target: string) => {
  let targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
};

export const mkdir = (path: string) => fs.mkdirSync(path);

// Taken from https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js with minor TS and stylistic edits.
export const copyFolderRecursive = (source: string, target: string) => {
  let files = [];

  // Check if folder needs to be created or integrated
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursive(curSource, targetFolder);
      } else {
        copyFile(curSource, targetFolder);
      }
    });
  }
};

export const clearFolderRecursive = (path: string) => {
  fs.rmSync(path, {recursive: true, force: true})
  mkdir(path)
}

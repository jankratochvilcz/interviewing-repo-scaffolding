import test from "ava";
import { getGitHubConfiguration } from "./configuration";

test.beforeEach(() => {
  process.env["GITHUB_TOKEN"] = "";
  process.env["DEFAULT_BRANCH"] = "";
  process.env["ORGANIZATION_NAME"] = "";
});

test("loads GitHub configuration", (t) => {
  process.env["GITHUB_TOKEN"] = "token";
  process.env["DEFAULT_BRANCH"] = "branch";
  process.env["ORGANIZATION_NAME"] = "org";

  const actual = getGitHubConfiguration();

  t.is(actual.defaultBranch, "branch");
  t.is(actual.organization, "org");
  t.is(actual.token, "token");
});
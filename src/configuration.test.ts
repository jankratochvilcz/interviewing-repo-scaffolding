import test from "ava";
import {
  defaultBranchEnvironmentVariable,
  getGitHubConfiguration,
  gitHubTokenEnvironmentVariable,
  organizationNameEnvironmentVariable,
} from "./configuration";

test.beforeEach(() => {
  process.env[gitHubTokenEnvironmentVariable] = "";
  process.env[defaultBranchEnvironmentVariable] = "";
  process.env[organizationNameEnvironmentVariable] = "";
});

test("loads GitHub configuration", (t) => {
  process.env[gitHubTokenEnvironmentVariable] = "token";
  process.env[defaultBranchEnvironmentVariable] = "branch";
  process.env[organizationNameEnvironmentVariable] = "org";

  const actual = getGitHubConfiguration();

  t.is(actual.defaultBranch, "branch");
  t.is(actual.organization, "org");
  t.is(actual.token, "token");
});

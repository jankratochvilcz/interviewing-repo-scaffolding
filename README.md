# Interviewing repo scaffolding

This project generates GitHub repositories pre-filled with issues and PRs for job applicants that will work on them as a part of their interviewing process.

Each candidate gets their repository where they collaborate with an interviewer on the completion of given tasks.

## Functionality

After going through the setup, you will be able to get the following by inputting candidates' GitHub usernames:
* **Generate a new repository** in a specified organization named after the candidate
* **Push sample code** to the repository
* Push feature branches to the repository
* **Generate Pull requests and Issues** based on markdown templates
* **Automatically invite the candidate** to the repository

## How to use

### 1. Clone repository

`git clone git@github.com:jankratochvilcz/interviewing-repo-scaffolding.git` and open it in your editor of choice.

### 2. Fill in README.md

Head to [templates/src/README.md](templates/src/README.md) and write general instructions for the candidate regarding how to use the test project. Information such as local environment setup belongs in the README.

### 3. Prepare sample code

If you don't want the candidate to start from scratch, copy the started code into `templates/src` and commit it to `main`.

If you want to give the candidate a PR to review or finish, create a new branch, edit the files within `templates/src`, and commit them.

### 4. Prepare issue and pull request descriptions

Add issue and pull request templates within `templates/` as markdown files. Add metadata to the header. Supported metadata is as follows.


|Property name|Example|Issues|Pull request|
|-|-|-|-|
|`title`|*App crashes during blog post editing*|✅|✅|
|`type`|`"pull_request" \| "issue"`|✅|✅|
|`branch`|`blog-editing`|❌|✅|

### 5. Add environment variables

Copy the `.env.example` file as `.env` and fill in individual environment variables.

|Variable|Purpose|
|-|-|
|GITHUB_TOKEN|Your [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the `repo` scope.|
|DEFAULT_BRANCH|The default branch for your repository, usually `main`|
|ORGANIZATION_NAME|The name of the organization where the repo will be created. For personal accounts the name of the user.|

### 5. Run it

Finally, run the tool via `npm run start` and follow the instructions to generate the repository and invite your candidate to it.

If you haven't run it before, don't forget to `npm install`. The project assumes you have Node and NPM installed. The tested version is Node v18.3.0 and NPM v8.11.0.
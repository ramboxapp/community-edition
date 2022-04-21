# Contributor's Guide

We welcome pull requests! Follow these steps to contribute:

1. Find an [issue](https://github.com/ramboxapp/community-edition/issues) that needs assistance.
1. Let us know you are working on it by posting a comment on the issue.
1. Follow the [Contribution Guidelines](#contribution-guidelines) to start working on the issue.

Working on your first Pull Request? You can learn how from this *free* series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

##### If you've found a bug that is not on the board, [follow these steps](README.md#found-a-bug).

---

## Contribution Guidelines

### Setup

- [Prerequisites](#prerequisites)
- [Forking the Project](#forking-the-project)
- [Create a Branch](#create-a-branch)
- [Set Up rambox](#set-up-rambox)

### Create

- [Make Changes](#make-changes)
- [Run The Test Suite](#run-the-test-suite)

### Submit

- [Creating a Pull Request](#creating-a-pull-request)
- [Common Steps](#common-steps)
- [How We Review and Merge Pull Requests](#how-we-review-and-merge-pull-requests)
- [How We Close Stale Issues](#how-we-close-stale-issues)
- [Next Steps](#next-steps)
- [Other Resources](#other-resources)

### Prerequisites

| Prerequisite                                                  | Version |
| ------------------------------------------------------------- | ------- |
| [Sencha](https://www.sencha.com/products/extjs/cmd-download/) | `=6.6.0.13`  |
| [Ruby](https://www.ruby-lang.org/en/downloads/)               | `=2.3` |
| [Node.js](https://nodejs.org)                                 | `~ ^4.0.0`  |
| npm (comes with Node)                                         | `~ ^3.8.7`  |

> _Updating to the latest releases is recommended_.

If Node.js, ruby, or sencha cmd is already installed on your machine, run the following commands to validate the versions:

```shell
node -v
ruby -v
sencha
```

If your versions are lower than the prerequisite versions, you should update.

### Forking the Project

#### Setting Up Your System

1. Install [Git](https://git-scm.com/) or your favorite Git client.
1. (Optional) [Setup an SSH Key](https://help.github.com/articles/generating-an-ssh-key/) for GitHub.

#### Forking rambox

1. Go to the top level rambox repository: <https://github.com/ramboxapp/community-edition>
1. Click the "Fork" Button in the upper right hand corner of the interface ([More Details Here](https://help.github.com/articles/fork-a-repo/))
1. After the repository (repo) has been forked, you will be taken to your copy of the rambox repo at <https://github.com/yourUsername/community-edition>

#### Cloning Your Fork

1. Open a Terminal / Command Line / Bash Shell in your projects directory (_i.e.: `/yourprojectdirectory/`_)
1. Clone your fork of rambox
    - `git clone https://github.com/yourUsername/community-edition.git`

**(make sure to replace `yourUsername` with your GitHub username)**

This will download the entire rambox repo to your projects directory.

#### Setup Your Upstream

1. Change directory to the new rambox directory (`cd community-edition`)
1. Add a remote to the official rambox repo:
    - `git remote add upstream https://github.com/ramboxapp/community-edition.git`

Congratulations, you now have a local copy of the rambox repo! :tada:

### Create a Branch

Before you start working, you will need to create a separate branch specific to the issue / feature you're working on. You will push your work to this branch.

#### Naming Your Branch

Name the branch something like `fix/xxx` or `feature/xxx` where `xxx` is a short description of the changes or feature you are attempting to add. For example

`fix/email-login` would be a branch where you fix something specific to email login.

#### Adding Your Branch

To create a branch on your local machine (and switch to this branch):

```shell
git checkout -b [name_of_your_new_branch]
```

and to push to GitHub:

```shell
git push origin [name_of_your_new_branch]
```

**If you need more help with branching, take a look at [this](https://github.com/Kunena/Kunena-Forum/wiki/Create-a-new-branch-with-git-and-manage-branches).**

### Set Up rambox

Once you have rambox cloned, before you start the application, you first need to install all of the dependencies:

```bash
# Install NPM dependencies
npm install
```

```bash
# Compile the files...
sencha app watch
npm start # in a new terminal
```

### Make Changes

This bit is up to you!

#### How to find the code in the rambox codebase to fix/edit

The best way to find out any code you wish to change/add or remove is using the GitHub search bar at the top of the repository page.
For example, you could search for a challenge name and the results will display all the files along with line numbers.
Then you can proceed to the files and verify this is the area that you were looking forward to edit.
Always feel free to reach out to the chat room when you are not certain of any thing specific in the code.

#### Adding or Editing Services

The services are stored inside the file `./api/services.json` in the `gh-pages` branch:

https://github.com/ramboxapp/community-edition/blob/gh-pages/api/services.json

Add your service to the *BOTTOM* of the array.
To see these changes you'll need to stop your `npm start` and `sencha app watch`, and then rerun those.

### Creating a Pull Request

#### What is a Pull Request?

A pull request (PR) is a method of submitting proposed changes to the rambox repo (or any repo, for that matter).
You will make changes to copies of thefiles which make up rambox in a personal fork, then apply to have them accepted by rambox proper.

#### Important: ALWAYS EDIT ON A BRANCH

Take away only one thing from this document: Never, **EVER** make edits to the `master` branch.
ALWAYS make a new branch BEFORE you edit files.
This is critical, because your copy of `master` will be forever sullied and the only way to fix it is a difficult hard-reset and force-push process, or deleting your fork and re-forking.

### Common Steps

1. Once the edits have been committed, you will be prompted to create a pull request on your fork's GitHub Page.
1. By default, all pull requests should be against the rambox main repo, `master` branch.
    - **Make sure that your Base Fork is set to ramboxapp/community-edition when raising a Pull Request.**
1. Submit a pull request.
1. The title (also called the subject) of your PR should be descriptive of your changes and succinctly indicates what is being fixed.
    - **Do not add the issue number in the PR title or commit message.**
    - Examples: `Added Service servicename` `Correct typo in menu`
1. In the body of your PR include a more detailed summary of the changes you made and why.
    - If the PR is meant to fix an existing bug/issue then, at the end of your PR's description, append the keyword `closes` and #xxxx (where xxxx is the issue number).
        - Example: `closes #1337`. This tells GitHub to automatically close the existing issue, if the PR is merged.
1. Indicate if you have tested on a local copy of the site or not.

### How We Review and Merge Pull Requests

Rambox has a team of volunteer Issue Moderators. These Issue Moderators routinely go through open pull requests in a process called [Quality Assurance](https://en.wikipedia.org/wiki/Quality_assurance) (QA).

1. If an Issue Moderator QA's a pull request and confirms that the new code does what it is supposed without seeming to introduce any new bugs, they will comment: `"LGTM" which means "Looks good to me."`
1. Another Issue Moderator will QA the same pull request.
    - Once they have also confirmed that the new code does what it is supposed to without seeming to introduce any new bugs, they will merge the pull request.

If you would like to apply to join our Issue Moderator team - which is a Core Team position - message [@BerkeleyTrue](https://gitter.im/berkeleytrue) with links to 5 of your pull requests that have been accepted and 5 issues where you have helped someone else through commenting or QA'ing.

### How We Close Stale Issues

We will close any issues or pull requests that have been inactive for more than 15 days, except those that match the following criteria:

- Bugs that are confirmed
- Pull requests that are waiting on other pull requests to be merged
- Features that are a part of a GitHub project

### Next Steps

#### If your PR is accepted

Once your PR is accepted, you may delete the branch you created to submit it.
This keeps your working fork clean.

You can do this with a press of a button on the GitHub PR interface. You can delete the local copy of the branch with: `git branch -D branch/to-delete-name`

#### If your PR is rejected

Don't despair! You should receive solid feedback as to why it was rejected and what changes are needed.

Many Pull Requests, especially first Pull Requests, require correction or updating.
If you have used the GitHub interface to create your PR, you will need to close your PR, create a new branch, and re-submit.

If you have a local copy of the repo, you can make the requested changes and amend your commit with: `git commit --amend`
This will update your existing commit.
When you push it to your fork you will need to do a force push to overwrite your old commit: `git push --force`

Be sure to post in the PR conversation that you have made the requested changes.

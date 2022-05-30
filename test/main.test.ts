import { Git } from "@/git";
import { resolve } from "path";
const ROOT_PATH = resolve();
const REPO_NAME = "gitrepo";
const git = new Git(ROOT_PATH, REPO_NAME);

test("git display and switch branch", async () => {
  await git.updateHead("master");
  const result = await git.findBranch(0, 2)
  expect(result).toEqual({
    branch: [
      {
        name: "master",
        latestCommit: "5d3886b5e0063cde98f815e87ad31b4bf58c5d15",
      },
      {
        name: "dev",
        latestCommit: "71ab32d443c4cb5d0ffeffeda931bea741b4957f",
      },
    ],
    page: 0,
    total: 2,
  });

  await git.updateHead('master')
  expect(await git.findHead()).toEqual({ name: 'master', type: 'commit' })

  await git.updateHead('dev')
  expect(await git.findHead()).toEqual({ name: 'dev', type: 'commit' })

  await git.updateHead('v1', true)
  expect(await git.findHead()).toEqual({ name: 'v1', type: 'tag' })

});

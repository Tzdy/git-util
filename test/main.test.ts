import { Git } from "@/git";
import { resolve } from "path";
const ROOT_PATH = resolve();
const REPO_NAME = "gitrepo";
const git = new Git(ROOT_PATH, REPO_NAME);

test("git display and switch branch", async () => {
  await git.updateHead("master");
  const result = await git.findBranch();
  expect(result).toEqual([
    {
      name: "master",
      latestCommit: "5d3886b5e0063cde98f815e87ad31b4bf58c5d15",
    },
    {
      name: "dev",
      latestCommit: "71ab32d443c4cb5d0ffeffeda931bea741b4957f",
    },
  ]);

  await git.updateHead("master");
  expect(await git.findHead()).toEqual({ name: "master", type: "commit" });

  await git.updateHead("dev");
  expect(await git.findHead()).toEqual({ name: "dev", type: "commit" });

  await git.updateHead("v1", true);
  expect(await git.findHead()).toEqual({ name: "v1", type: "tag" });
});

test("find commits", async () => {
  const commits = await git.findCommit('master')
  expect(commits).toEqual([
    {
      username: 'Tsdy',
      time: new Date('2022-05-30T10:00:30.000Z'),
      commitHash: '5d3886b',
      treeHash: '79be2f0',
      comment: 'merge'
    },
    {
      username: 'Tsdy',
      time: new Date('2022-05-30T09:48:37.000Z'),
      commitHash: 'b0fd673',
      treeHash: '26a16b3',
      comment: 'master'
    },
    {
      username: 'Tsdy',
      time: new Date('2022-05-30T09:45:59.000Z'),
      commitHash: '71ab32d',
      treeHash: 'a8d8bc4',
      comment: 'dev'
    },
    {
      username: 'Tsdy',
      time: new Date('2022-05-30T09:45:31.000Z'),
      commitHash: '858a8ed',
      treeHash: 'd34fba8',
      comment: 'init'
    }
  ])
})

test('find diffItem', async () => {
  const result = await git.findDiffItems(4)
  expect(result).toEqual({
    b0fd673: [ { status: 'M', name: 'index.html' } ],
    '71ab32d': [ { status: 'M', name: 'index.html' } ],
    '858a8ed': [ { status: 'A', name: 'index.html' } ]
  })
})
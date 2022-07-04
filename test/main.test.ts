import { Git } from "@/git";
import { resolve } from "path";
const ROOT_PATH = resolve();
const REPO_NAME = "gitrepo";
const git = new Git(ROOT_PATH, REPO_NAME);
describe("git", () => {
  test("git display and switch branch", async () => {
    await git.updateHead("master");
    const result = await git.findBranch();
    expect(result).toEqual([
      {
        name: "master",
        latestCommit: "bf7d5e1bf760080311b120abd258a48627d47df0",
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
    const commits = await git.findCommit("master");
    expect(commits).toEqual([
      {
        comment: "add a dir",
        commitHash: "bf7d5e1bf760080311b120abd258a48627d47df0",
        time: new Date("2022-07-04T14:21:28.000Z"),
        treeHash: "a9bc48f560b0c94c26d469b6c62c023d038bd637",
        username: "Tsdy",
      },
      {
        username: "Tsdy",
        time: new Date("2022-05-30T10:00:30.000Z"),
        commitHash: "5d3886b5e0063cde98f815e87ad31b4bf58c5d15",
        treeHash: "79be2f0f9965def3bf93262900999ef1f169e92d",
        comment: "merge",
      },
      {
        username: "Tsdy",
        time: new Date("2022-05-30T09:48:37.000Z"),
        commitHash: "b0fd673786639a413c987121b246d65b3c8f1e7d",
        treeHash: "26a16b3d267e7d8f3ed943e43fbc100a4ea70fdc",
        comment: "master",
      },
      {
        username: "Tsdy",
        time: new Date("2022-05-30T09:45:59.000Z"),
        commitHash: "71ab32d443c4cb5d0ffeffeda931bea741b4957f",
        treeHash: "a8d8bc420f0fa441b2f61d15124083dfe2ffe34d",
        comment: "dev",
      },
      {
        username: "Tsdy",
        time: new Date("2022-05-30T09:45:31.000Z"),
        commitHash: "858a8ed503710b0ee916097d07d8dc28c6812f5e",
        treeHash: "d34fba8343729ae1913f8b19311b13795946680e",
        comment: "init",
      },
    ]);
  });

  test("find diffItem", async () => {
    await git.updateHead("master");
    const items = await git.findDiffItem("HEAD");
    expect(items).toEqual([
      {
        hash: "3a4658f192a502b56e49456691672ec99fe481ab",
        commitHash: "bf7d5e1bf760080311b120abd258a48627d47df0",
      },
      {
        hash: "56efbdba61ff12f90f864930b9a85eac0259666d",
        commitHash: "bf7d5e1bf760080311b120abd258a48627d47df0",
      },
      {
        hash: "b54d14dd98cf67071749b29e567ef79b52ff3223",
        commitHash: "b0fd673786639a413c987121b246d65b3c8f1e7d",
      },
      {
        hash: "4767066f593c489c399873369a73e137ac8a0ff9",
        commitHash: "71ab32d443c4cb5d0ffeffeda931bea741b4957f",
      },
    ]);
  });

  test("findTree", async () => {
    const items = await git.findTree("HEAD");
    expect(items).toEqual([
      {
        type: "blob",
        hash: "ae6c6651aa9f519698cff70276cc799ff894e327",
        name: "index.html",
      },
      {
        type: "tree",
        hash: "3a4658f192a502b56e49456691672ec99fe481ab",
        name: "src",
      },
    ]);
  });

  test("findBlob", async () => {
    const items = await git.findBlob(
      "ae6c6651aa9f519698cff70276cc799ff894e327"
    );
    expect(items.replace(/[ |\n]/gs, "")).toBe(`<html></html><body></body>`);
  });
});

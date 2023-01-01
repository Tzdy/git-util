import { Git } from "@/git";
import { resolve } from "path";
const ROOT_PATH = resolve();
const REPO_NAME = "gitrepo";
const git = new Git(ROOT_PATH, REPO_NAME);
describe("display and switch branch", () => {
  it("find all branch", async () => {
    const result = await git.findBranch();
    expect(result).toEqual([
      {
        name: "master",
        latestCommit: "78bbea4945106102c4acd49a071a9ca822e4be95",
      },
      {
        name: "dev",
        latestCommit: "71ab32d443c4cb5d0ffeffeda931bea741b4957f",
      },
    ]);
  });

  it("switch branch master", async () => {
    await git.updateHead("master");
    expect(await git.findHead()).toEqual({ name: "master", type: "commit" });
  });

  it("switch branch dev", async () => {
    await git.updateHead("dev");
    expect(await git.findHead()).toEqual({ name: "dev", type: "commit" });
  });

  it("switch tag v1", async () => {
    await git.updateHead("v1", true);
    expect(await git.findHead()).toEqual({ name: "v1", type: "tag" });
  });
});

describe("commit", () => {
  it("switch master", async () => {
    await git.updateHead("master");
    expect(await git.findHead()).toEqual({ name: "master", type: "commit" });
  });

  it("find commits", async () => {
    const commits = await git.findCommit("master");
    expect(commits).toEqual([
      {
        comment: "delete",
        commitHash: "78bbea4945106102c4acd49a071a9ca822e4be95",
        time: new Date("2022-10-01T13:28:32.000Z"),
        treeHash: "79be2f0f9965def3bf93262900999ef1f169e92d",
        username: "Tsdy",
      },
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

  it("find commits commitHashList", async () => {
    const commits = await git.findCommit("master", undefined, undefined, [
      "bf7d5e1bf760080311b120abd258a48627d47df0",
      "71ab32d443c4cb5d0ffeffeda931bea741b4957f",
    ]);
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
        time: new Date("2022-05-30T09:45:59.000Z"),
        commitHash: "71ab32d443c4cb5d0ffeffeda931bea741b4957f",
        treeHash: "a8d8bc420f0fa441b2f61d15124083dfe2ffe34d",
        comment: "dev",
      },
    ]);
  });

  it("find commits page limit", async () => {
    const commits1 = await git.findCommit("master", 1, 2);
    const commits2 = await git.findCommit("master", 2, 2);
    expect(commits1).toEqual([
      {
        comment: "delete",
        commitHash: "78bbea4945106102c4acd49a071a9ca822e4be95",
        time: new Date("2022-10-01T13:28:32.000Z"),
        treeHash: "79be2f0f9965def3bf93262900999ef1f169e92d",
        username: "Tsdy",
      },
      {
        comment: "add a dir",
        commitHash: "bf7d5e1bf760080311b120abd258a48627d47df0",
        time: new Date("2022-07-04T14:21:28.000Z"),
        treeHash: "a9bc48f560b0c94c26d469b6c62c023d038bd637",
        username: "Tsdy",
      },
    ]);

    expect(commits2).toEqual([
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
    ]);
  });

  const commitHashList: Array<string> = [];
  it("fimd all commit hash", async () => {
    commitHashList.push(...(await git.findAllCommitHash("master")));
    expect(commitHashList).toEqual([
      "78bbea4945106102c4acd49a071a9ca822e4be95",
      "bf7d5e1bf760080311b120abd258a48627d47df0",
      "5d3886b5e0063cde98f815e87ad31b4bf58c5d15",
      "b0fd673786639a413c987121b246d65b3c8f1e7d",
      "71ab32d443c4cb5d0ffeffeda931bea741b4957f",
      "858a8ed503710b0ee916097d07d8dc28c6812f5e",
    ]);
  });

  it("find diffItem", async () => {
    const items = await git.findDiffItem(commitHashList);
    expect(items).toEqual([
      {
        comment: "delete",
        commitHash: "78bbea4945106102c4acd49a071a9ca822e4be95",
        hash: "3a4658f192a502b56e49456691672ec99fe481ab",
        time: new Date("2022-10-01T13:28:32.000Z"),
        treeHash: "79be2f0f9965def3bf93262900999ef1f169e92d",
        type: "D",
        path: "src",
        itemType: "tree",
        langId: -1,
        username: "Tsdy",
      },
      {
        comment: "delete",
        commitHash: "78bbea4945106102c4acd49a071a9ca822e4be95",
        hash: "56efbdba61ff12f90f864930b9a85eac0259666d",
        time: new Date("2022-10-01T13:28:32.000Z"),
        treeHash: "79be2f0f9965def3bf93262900999ef1f169e92d",
        type: "D",
        path: "src/test.html",
        langId: 146,
        itemType: "blob",
        username: "Tsdy",
      },
      {
        hash: "3a4658f192a502b56e49456691672ec99fe481ab",
        username: "Tsdy",
        time: new Date("2022-07-04T14:21:28.000Z"),
        commitHash: "bf7d5e1bf760080311b120abd258a48627d47df0",
        treeHash: "a9bc48f560b0c94c26d469b6c62c023d038bd637",
        type: "A",
        path: "src",
        itemType: "tree",
        langId: -1,
        comment: "add a dir",
      },
      {
        hash: "56efbdba61ff12f90f864930b9a85eac0259666d",
        username: "Tsdy",
        time: new Date("2022-07-04T14:21:28.000Z"),
        commitHash: "bf7d5e1bf760080311b120abd258a48627d47df0",
        treeHash: "a9bc48f560b0c94c26d469b6c62c023d038bd637",
        type: "A",
        itemType: "blob",
        path: "src/test.html",
        langId: 146,
        comment: "add a dir",
      },
      {
        hash: "ae6c6651aa9f519698cff70276cc799ff894e327",
        username: "Tsdy",
        time: new Date("2022-05-30T10:00:30.000Z"),
        commitHash: "5d3886b5e0063cde98f815e87ad31b4bf58c5d15",
        treeHash: "79be2f0f9965def3bf93262900999ef1f169e92d",
        type: "M",
        itemType: "blob",
        path: "index.html",
        langId: 146,
        comment: "merge",
      },
      {
        hash: "b54d14dd98cf67071749b29e567ef79b52ff3223",
        username: "Tsdy",
        time: new Date("2022-05-30T09:48:37.000Z"),
        commitHash: "b0fd673786639a413c987121b246d65b3c8f1e7d",
        treeHash: "26a16b3d267e7d8f3ed943e43fbc100a4ea70fdc",
        type: "M",
        itemType: "blob",
        path: "index.html",
        langId: 146,
        comment: "master",
      },
      {
        hash: "4767066f593c489c399873369a73e137ac8a0ff9",
        username: "Tsdy",
        time: new Date("2022-05-30T09:45:59.000Z"),
        commitHash: "71ab32d443c4cb5d0ffeffeda931bea741b4957f",
        treeHash: "a8d8bc420f0fa441b2f61d15124083dfe2ffe34d",
        type: "M",
        itemType: "blob",
        path: "index.html",
        langId: 146,
        comment: "dev",
      },
      {
        hash: "6c70bcfe4d48d15f8a6531d6b491e65d641a377c",
        username: "Tsdy",
        time: new Date("2022-05-30T09:45:31.000Z"),
        commitHash: "858a8ed503710b0ee916097d07d8dc28c6812f5e",
        treeHash: "d34fba8343729ae1913f8b19311b13795946680e",
        type: "A",
        itemType: "blob",
        path: "index.html",
        langId: 146,
        comment: "init",
      },
    ]);
  });

  it("findTree HEAD", async () => {
    const items = await git.findTree("HEAD");
    expect(items).toEqual([
      {
        type: "blob",
        hash: "ae6c6651aa9f519698cff70276cc799ff894e327",
        name: "index.html",
        path: "index.html",
      },
    ]);
  });

  it("findTree commitHash bf7d5e1bf760080311b120abd258a48627d47df0", async () => {
    const items = await git.findTree(
      "bf7d5e1bf760080311b120abd258a48627d47df0"
    );
    expect(items).toEqual([
      {
        type: "blob",
        hash: "ae6c6651aa9f519698cff70276cc799ff894e327",
        name: "index.html",
        path: "index.html",
      },
      {
        type: "tree",
        hash: "3a4658f192a502b56e49456691672ec99fe481ab",
        name: "src",
        path: "src/",
      },
    ]);
  });

  it("findTree commitHash bf7d5e1bf760080311b120abd258a48627d47df0 src/", async () => {
    const items = await git.findTree(
      "bf7d5e1bf760080311b120abd258a48627d47df0",
      "src/"
    );
    expect(items).toEqual([
      {
        type: "blob",
        hash: "56efbdba61ff12f90f864930b9a85eac0259666d",
        name: "test.html",
        path: "src/test.html",
      },
    ]);
  });

  it("findBlob", async () => {
    const item = await git.findBlob("HEAD", "index.html");
    console.log(item);
    expect(item.value.replace(/[ |\n]/gs, "")).toBe(
      `<html></html><body></body>`
    );
    expect(item.size).toBe(34);
  });
});

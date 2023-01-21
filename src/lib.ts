import { Git } from "./git";
const git = new Git(
  "/Users/mac/Documents/web/server/gogs/ty-git",
  "gitrepo.git"
);
// git
//   .findBlob("ae6c6651aa9f519698cff70276cc799ff894e327")
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((res) => {
//     console.log(res);
//   });
// git.findTree('HEAD').then(res => {
//     console.log(res)
// })
// git.updateHead('dev')
// git.findBranch(0, 6).then(res => console.log(res))
// git.updateHead('v1', true)
// git.findHead().then(res => console.log(res))
// git.findCommit('master').then(res => {
//     console.log(res)
// })
// git.findDiffItems(4).then(res => console.log(res))

async function main() {
  //   for (let i = 0; i < 100; i++) {
  //     const result = await git.findBranch();
  //     if (result.length === 0) {
  //       throw new Error(`${i}`);
  //     }
  //   }
  // const list = await git.findAllCommitHash("master");
  // await git.findDiffItem(list);
  // console.log(list);
  // console.log(await git.findDiffItem(list));
  // await git.createDirAndInitBare();
  const tree = await git.lsTree(
    "bf7d5e1bf760080311b120abd258a48627d47df0",
    ".",
    true
  );
  console.log(tree);
}

main();

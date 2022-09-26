import { Git } from "./git";
const git = new Git("/Users/mac/Documents/web/server/gogs/ty-git", "git.git");
git
  .findBlob("ae6c6651aa9f519698cff70276cc799ff894e327")
  .then((res) => {
    console.log(res);
  })
  .catch((res) => {
    console.log(res);
  });
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
  // console.log(await git.findDiffItem(await git.findAllCommitHash("master")));
  await git.createDirAndInitBare();
}

main();

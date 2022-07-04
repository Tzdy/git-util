import { Git } from "./git";
const git = new Git('/Users/mac/Documents/web/server/gogs/ty-git', 'gitrepo.git')
git.findDiffItem('HEAD').then(res => {
    console.log(res)
})
// git.updateHead('dev')
// git.findBranch(0, 6).then(res => console.log(res))
// git.updateHead('v1', true)
// git.findHead().then(res => console.log(res))
// git.findCommit('master').then(res => {
//     console.log(res)
// })
// git.findDiffItems(4).then(res => console.log(res))
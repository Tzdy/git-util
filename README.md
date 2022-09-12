# TyGitUtil

## Start
`npm install @tsdy/git --save`

``` ts
import { Git } from '@tsdy/git'
const ROOT_PATH = '' // 根目录
const REPO_NAME = '' // 仓库名（文件夹名称）
const git = new Git(ROOT_PATH, REPO_NAME)
......
```

## Api

### findBranch 
获取所有分支

``` ts
type Branch = {
    name: string; // 分支名
    latestCommit: string; // 该分支下最新一次commit hash
}
function findBranch(): Promise<Array<Branch>>
```

### updateHead
修改当前HEAD指向

``` ts
function updateHead(name: string, tag: boolean = false): Promise<void>
```

#### Params
* **name**: 分支名或标签名
* **tag**: name是否为标签名

### findHead
获取当前HEAD指向

``` ts
type Head = {
    type: 'commit' | 'tag';
    name: string;
}

function findHead(): Promise<Head>
```

### findCommit
获取指定分支下所有提交信息

``` ts
type Commit = {
    username: string; // 提交者名称
    time: Date; // 提交时间
    commitHash: string;
    treeHash: string;
    comment: string; // 提交信息
}

function findCommit(branchName: string): Promise<Array<Commit>>
```

#### Params
* **branchName**: 分支名

### findDiffItem
获取指定分支下，文件/文件夹（blob/tree）被修改的commitHash和hash

``` ts
type Item = {
    commitHash: string;
    hash: string;
}

function findDiffItem(commitHash: string, limit?: number): Promise<Array<Item>>
```

#### Params
* **commitHash**: 提交对应的hash
* **limit**: 由于这个函数会获得从初始提交到到当前commitHash间**所有文件变动**，如果不想获取所有变动，可以通过limit指定commit的数量。（如果有三个新提交，那么limit应该为4）

### findTree
获取指定commitHash/treeHash的文件列表

``` ts
type TreeItem = {
    type: 'blob' | 'tree';
    hash: string; // 文件或目录对应的hash
    name: string;
}
function findTree(hash: string): Promise<Array<TreeItem>>
```

#### Params
* **hash** 这个hash可以是commitHash和treeHash

### findBlob
通过blobHash获取文件内容(自动转换为UTF-8)

``` ts
function findBlob(blobHash: string): Promise<string>
```

#### Params
* **blobHash** blob对应的hash，可以通过findTree获取。
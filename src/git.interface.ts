export type Branch = {
    name: string;
    latestCommit: string;
}

export type Head = {
    type: 'commit' | 'tag';
    name: string;
}

export type Commit = {
    username: string; // 提交者名称
    time: Date; // 提交时间
    commitHash: string;
    treeHash: string;
    comment: string;
}
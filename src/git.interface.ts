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

export interface Item {
    commitHash: string;
    hash: string;
}

export interface TreeItem {
    type: 'blob' | 'tree';
    hash: string;
    name: string;
}
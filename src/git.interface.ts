export type BranchItem = {
    name: string;
    latestCommit: string;
}
export type Branch = {
    branch: Array<BranchItem>;
    page: number;
    total: number;
}
export type Head = {
    type: 'commit' | 'tag';
    name: string;
}
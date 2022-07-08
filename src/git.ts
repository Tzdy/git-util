import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { join } from "path";
import { Branch, Commit, Head, Item, TreeItem } from "./git.interface";

export class Git {
  private repoPath: string;

  constructor(rootPath: string, repoName: string) {
    if (!/\.git$/.test(repoName)) {
      repoName += ".git";
    }
    this.repoPath = join(rootPath, repoName);
  }

  private exception(child: ChildProcessWithoutNullStreams, reject: Function) {
    child.on("error", (err) => {
      reject(err);
    });
    child.stdout.on("error", (err) => {
      reject(err);
    });
    child.stderr.on("error", (err) => {
      reject(err);
    });
  }

  private spawn(argvs: Array<string>): Promise<void>;
  private spawn<T>(
    argvs: Array<string>,
    fn?: (
      data: string,
      resolve: (value: T) => void,
      reject: (reason: any) => void
    ) => void
  ): Promise<T>;

  private spawn<T>(
    argvs: Array<string>,
    fn?: (
      data: string,
      resolve: (value: T) => void,
      reject: (reason: any) => void
    ) => void
  ) {
    return new Promise<T | undefined>((resolve, reject) => {
      let data = "";
      const child = spawn("git", argvs, {
        cwd: this.repoPath,
      });
      this.exception(child, reject);
      child.stdout.on("data", (buffer) => {
        data += buffer.toString("utf-8");
      });
      child.on("exit", () => {
        if (fn) {
          // 由于需要按照\n切割字符串，所以清除最后一个\n
          fn(data.replace(/\n$/, ""), resolve, reject);
        } else {
          resolve(void 0);
        }
      });
    });
  }

  private spawnPipe<T>(
    argvsArr: Array<Array<string>>,
    fn?: (
      data: string,
      resolve: (value: T) => void,
      reject: (reason: any) => void
    ) => void
  ) {
    return new Promise((resolve, reject) => {
      let data = "";
      let resultChild: ChildProcessWithoutNullStreams | undefined;
      function isChildProcess(
        resultChild: any
      ): resultChild is ChildProcessWithoutNullStreams {
        if (argvsArr.length !== 0 && resultChild) {
          return true;
        }
        return false;
      }
      argvsArr.forEach((argvs) => {
        const child = spawn("git", argvs, {
          cwd: this.repoPath,
        });
        this.exception(child, reject);
        if (resultChild) {
          resultChild.stdout.pipe(child.stdin);
        }
        resultChild = child;
      });

      if (isChildProcess(resultChild)) {
        resultChild.stdout.on("data", (buffer) => {
          data += buffer.toString("utf-8");
        });
        resultChild.on("exit", () => {
          if (fn) {
            // 由于需要按照\n切割字符串，所以清除最后一个\n
            fn(data.replace(/\n$/, ""), resolve, reject);
          } else {
            resolve(void 0);
          }
        });
      }
    });
  }

  public findBranch() {
    const result: Array<Branch> = [];
    return this.spawn<Array<Branch>>(
      ["show-ref", "--heads"],
      (data, resolve, reject) => {
        // 可能出现空仓库
        if (data.length !== 0) {
          const array = data.split("\n");
          array.forEach((item) => {
            if (item) {
              const sub = item.split(" ");
              const branchName = sub[1].replace(/^refs\/heads\//, "");
              const latestCommit = sub[0];
              result.unshift({
                name: branchName,
                latestCommit,
              });
            }
          });
        }
        resolve(result);
      }
    );
  }

  public updateHead(name: string, tag: boolean = false) {
    // 如果tag为true，就是将HEAD移动到标签名所在分支上
    return this.spawn([
      "symbolic-ref",
      "HEAD",
      `refs/${tag === true ? "tags" : "heads"}/${name}`,
    ]);
  }

  public findHead() {
    return this.spawn<Head>(
      ["symbolic-ref", "HEAD"],
      (data, resolve, reject) => {
        const sub = data.split("/");
        return resolve({
          name: sub[2],
          type: sub[1] === "heads" ? "commit" : "tag",
        });
      }
    );
  }

  public findCommit(branchName: string) {
    return this.spawn<Array<Commit>>(
      [
        "log",
        "--format={@}%cN{@}%ci{@}%H{@}%T{@}%B{@}{end}",
        "--date=iso8601-strict",
        branchName,
      ],
      (data, resolve, reject) => {
        const result: Array<Commit> = [];
        const array = data.split("{end}");
        array.forEach((item) => {
          if (item) {
            /*
            这个是正则匹配的原始字符串。
            {@}Tsdy{@}2022-05-30 18:00:30 +0800{@}5d3886b{@}79be2f0{@}merge
            {@}{end} 
            */
            const match = item.match(
              /\{@\}(.*?)\{@\}(.*?)\{@\}(.*?)\{@\}(.*?)\{@\}(.*?)\n\{@\}/s
            );
            if (match) {
              result.push({
                username: match[1], // 提交者名称
                time: new Date(match[2]), // 提交时间
                commitHash: match[3],
                treeHash: match[4],
                comment: match[5],
              });
            }
          }
        });
        resolve(result);
      }
    );
  }

  // 如果有三个新提交，那么limit应该为4
  public findDiffItem(commitHash: string, limit?: number) {
    const revListArgvs: string[] = ["rev-list", commitHash];
    if (limit !== undefined) {
      revListArgvs.push(`-${limit}`);
    }
    // -t 显示树条目本身以及子树。
    // --root 包括第一次提交
    // -c 包括 merge
    return this.spawnPipe<Item[]>(
      [revListArgvs, ["diff-tree", "--stdin", "-t", "--root", "-c"]],
      (data, resolve, reject) => {
        const items: Array<Item> = [];
        let commitHash = "";
        data.split("\n").forEach((item) => {
          if (item[0] === ":" && item[1] === ':') {
            const rightFileHash = item.slice(105, 145);
            const type = item.slice(146, 148).trim();
            if (type === "D") {
              return;
            }
            const goal = {
              hash: rightFileHash,
              commitHash,
            };
            items.push(goal);
          } else if (item[0] === ":") {
            const rightFileHash = item.slice(56, 96);
            // type 可能是两个或一个字符
            const type = item.slice(97, 99).trim();
            // 删除文件后，右边的hash是000000000......
            // 但是，如果使用左边的话，就会冲突，因为一定会存在一次添加/修改
            // 的hash值和删除时相同。
            // 所以，我们不保存删除的
            if (type === "D") {
              return;
            }
            // \t 是一个字符 注意了
            // const dotFilename = item.slice(99, item.length);
            const goal = {
              hash: rightFileHash,
              commitHash,
            };
            items.push(goal);
          } else {
            commitHash = item;
          }
        });
        resolve(items);
      }
    );
  }

  // 这个hash可以是commitHash和treeHash
  public findTree(hash: string) {
    return this.spawn<TreeItem[]>(
      ["ls-tree", hash],
      (data, resolve, reject) => {
        const items: TreeItem[] = [];
        data.split("\n").forEach((item) => {
          if (item) {
            const array = item.split(" ");
            const hashOrName = array[2].split("\t");
            const it = {
              type: array[1] as "blob" | "tree",
              hash: hashOrName[0],
              name: hashOrName[1],
            };
            items.push(it);
          }
        });
        resolve(items);
      }
    );
  }

  public findBlob(blobHash: string) {
    return this.spawn<string>(['cat-file', '-p', blobHash], (data, resolve, reject) => {
      resolve(data)
    })
  }
}

import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { mkdir } from "fs/promises";
import { join } from "path";
import { Branch, Commit, Head, Item, TreeItem } from "./git.interface";
import { parseLanguageAfterFix } from "./language";

export * from "./language";

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
      child.on("close", () => {
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
        resultChild.on("close", () => {
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

  public findAllCommitHash(branchName: string) {
    return this.spawn<Array<string>>(
      ["rev-list", branchName],
      (data, resolve, reject) => {
        const commitHashList = data.split("\n");
        resolve(commitHashList);
      }
    );
  }

  public findDiffItem(commitHashList: Array<string>) {
    // -t 显示树条目本身以及子树。
    // --root 包括第一次提交
    // -c 包括 merge
    return this.spawn<Item[]>(
      [
        "log",
        ...commitHashList,
        "--format={@}%cN{@}%ci{@}%H{@}%T{@}%B{@}{end}",
        "--raw",
        "-t",
        "-c",
        "--abbrev=40",
        "--no-walk=unsorted",
      ],
      (data, resolve, reject) => {
        const commitInfoList = (
          data.match(
            /\{@\}(.*?)\{@\}(.*?)\{@\}(.*?)\{@\}(.*?)\{@\}(.*?)\n\{@\}\{end\}/gs
          ) || []
        ).map((raw) => {
          const match = raw.match(
            /\{@\}(.*?)\{@\}(.*?)\{@\}(.*?)\{@\}(.*?)\{@\}(.*?)\n\{@\}/s
          );
          if (match) {
            const log = {
              username: match[1], // 提交者名称
              time: new Date(match[2]), // 提交时间
              commitHash: match[3],
              treeHash: match[4],
              comment: match[5],
            };
            return log;
          }
        });
        const items: Array<Item> = [];
        // commitInfoList.length === items.length 是绝对相等的
        data
          .split(/\{@\}.*?\{@\}.*?\{@\}.*?\{@\}.*?\{@\}.*?\n\{@\}\{end\}/s)
          .slice(1)
          .forEach((raw, index) => {
            if (!raw) {
              return;
            }
            const commit = commitInfoList[index];
            if (!commit) {
              return;
            }
            raw.split("\n").forEach((item) => {
              if (item[0] === ":" && item[1] === ":") {
                const rightFileHash = item.slice(105, 145);
                // 合并的情况MM也当作M处理
                const type = item.slice(146, 147).trim() as "D" | "M" | "A";
                const path = item.slice(149);
                const goal = {
                  hash: rightFileHash,
                  type,
                  itemType: "blob" as "blob" | "tree",
                  path,
                  langId: -1,
                  ...commit,
                };
                if (type === "D") {
                  const leftFileHash = item.slice(15, 55);
                  goal.hash = leftFileHash;
                }
                items.push(goal);
              } else if (item[0] === ":") {
                const rightFileHash = item.slice(56, 96);
                // type 可能是两个或一个字符
                const type = item.slice(97, 98).trim() as "D" | "M" | "A";
                // 删除文件后，右边的hash是000000000......
                // 除了删除操作外，使用右边的hash值。
                // \t 是一个字符 注意了
                // const dotFilename = item.slice(99, item.length);
                const path = item.slice(99);
                const goal = {
                  hash: rightFileHash,
                  type,
                  itemType: "blob" as "blob" | "tree",
                  path,
                  langId: -1,
                  ...commit,
                };
                if (type === "D") {
                  const leftFileHash = item.slice(15, 55);
                  goal.hash = leftFileHash;
                }
                items.push(goal);
              }
            });
          });
        // 判断itemType是blob还是tree
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const nextItem = items[i + 1];
          if (item.type === "A" || item.type === "D") {
            if (nextItem) {
              if (nextItem.path.match(new RegExp(`^${item.path}`))) {
                item.itemType = "tree";
              }
            }
          }
        }
        // 设置文件语言类型
        items.forEach((item) => {
          if (item.itemType === "tree") {
            return;
          }
          const afterFixArr = item.path.split("/").pop()?.split(".");
          if (!afterFixArr) {
            return;
          }
          let afterFix = afterFixArr[afterFixArr.length - 1];
          if (afterFixArr.length > 1) {
            afterFix = "." + afterFix;
          }
          if (afterFix) {
            const lang = parseLanguageAfterFix(afterFix);
            if (lang) {
              item.langId = lang.languageId;
            }
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
    return this.spawn<string>(
      ["cat-file", "-p", blobHash],
      (data, resolve, reject) => {
        resolve(data);
      }
    );
  }

  public async createDirAndInitBare() {
    await mkdir(this.repoPath);
    return this.spawn<void>(["init", "--bare"], (data, resolve, reject) => {
      resolve(void 0);
    });
  }
}

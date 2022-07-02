import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { join } from "path";
import { Branch, Commit, Head, Item } from "./git.interface";

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

  public findDiffItems(limit: number) {
    return this.spawn<Record<string, Array<Item>>>(
      ["log", "--format={start}%h", "--name-status", `-${limit}`],
      (data, resolve, reject) => {
        const map: Record<string, Array<Item>> = {};
        data
          .split("{start}")
          .filter((item) => item)
          .map((item) => item.split("\n"))
          .filter((item) => item)
          .forEach((items) => {
            items = items.filter((item) => item);
            const commitHash = items[0];
            items.slice(1).forEach((str) => {
              const diffItemArray = str.split("\t");
              const diffItem = {
                status: diffItemArray[0],
                name: diffItemArray[1],
              };
              if (diffItem.name) {
                if (!map[commitHash]) {
                  map[commitHash] = [];
                }
                map[commitHash].push(diffItem);
              }
            });
          });
        resolve(map);
      }
    );
  }

  public findDiffInfo(commitHash: string) {
    return this.spawn<any>(
      ["diff-tree", "-r", "--full-index", "--root", commitHash],
      (data, resolve, reject) => {
        console.log(data)
        data.split("\n").forEach((item) => {
          if (item[0] === ":") {
            // const leftFileHash = item.slice(15, 55)
            const rightFileHash = item.slice(56, 96);
            const type = item.slice(97, 98);
            if (type === "D") {
              return;
            }
            // \t 是一个字符 注意了
            const dotFilename = item.slice(99, item.length);
            const dotTreeArr = dotFilename.split("/");
            let dotTreename = ""; // 假如又一个 apple/banana/a.js。需要遍历这个字符串。
            // 相当于 apple  apple/banana  apple/banana/a.js（最后一个不需要遍历）
            for (let i = 0; i < dotTreeArr.length - 1; i++) {
              dotTreename += dotTreeArr[i];
              console.log(dotTreename);
              dotTreename += "/";
            }
          }
        });
        resolve(void 0)
      }
    );
  }
}

const array: any[] = []
let total = 10000
let sit = 0

function callback() {
    git.findHead().then(() => {
        sit ++
        if (total - sit === array.length) {
            array.forEach(fn => callback())
            array.length = 0
        }
        if (sit === total) {
            console.timeEnd('time')
        }
    }, err => {
        array.push(git.findHead.bind(git))
    })
}
console.time('time')
for (let i = 0; i < total; i ++) {
  callback()
}
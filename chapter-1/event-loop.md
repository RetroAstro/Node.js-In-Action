#### 什么是事件循环?

EventLoop 是一种常用的机制，通过对内部或外部的事件提供者发出请求，如文件读写、网络连接等异步操作，完成后调用事件处理程序，整个过程都是异步阶段。

#### Node.js 中的事件循环机制

![](https://user-gold-cdn.xitu.io/2018/5/21/163817de4a1ca52c?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

与浏览器端的事件循环不同，Node.js 中的每次事件循环都包含了6个阶段。

- **timers 阶段**：这个阶段执行 timer（`setTimeout`、`setInterval`）的回调
- **I/O callbacks 阶段**：执行一些系统调用错误，比如网络通信的错误回调
- **idle, prepare 阶段**：仅 Node 内部使用
- **poll 阶段**：获取新的 I/O 事件, 适当的条件下 Node 将阻塞在这里
- **check 阶段**：执行 `setImmediate()` 的回调
- **close callbacks 阶段**：执行 `socket` 的 `close` 事件回调

重点的三个阶段主要在`timers`、`poll`、`check`这3个阶段。

**timers 阶段**

timers 是事件循环的第一个阶段，Node 会去检查有无已过期的 timer，如果有则把它的回调压入 timer 的任务队列中等待执行，事实上，Node 并不能保证 timer 在预设时间到了就会立即执行，因为 Node 对 timer 的过期检查不一定靠谱，它会受机器上其它运行程序影响，或者那个时间点主线程不空闲。

**poll 阶段**

poll 阶段主要有2个功能：

- 处理 poll 队列的事件
- 当有已超时的 timer，执行它的回调函数

EventLoop 将同步执行 poll 队列里的回调，直到队列为空或执行的回调达到系统上限，接下来 EventLoop 会去检查有无预设的`setImmediate()`，分两种情况：

1. 若有预设的`setImmediate()`, EventLoop 将结束 poll 阶段进入 check 阶段，并执行 check 阶段的任务队列
2. 若没有预设的`setImmediate()`，EventLoop 将阻塞在该阶段等待

注意一个细节，没有`setImmediate()`会导致 EventLoop 阻塞在 poll 阶段，这样之前设置的 timer 岂不是执行不了？所以咧，在 poll 阶段 EventLoop 会有一个检查机制，检查 timer 队列是否为空，如果 timer 队列非空，EventLoop 就开始下一轮事件循环，即重新进入到 timer 阶段。

**check 阶段**

`setImmediate()`的回调会被加入 check 队列中， 从 EventLoop 的阶段图可以知道，check 阶段的执行顺序在poll 阶段之后。

来看一个例子

```js
const fs = require('fs')

fs.readFile('test.txt', () => {
  console.log('readFile')
  setTimeout(() => {
    console.log('timeout')
  }, 0)
  setImmediate(() => {
    console.log('immediate')
  })
})
```

执行结果为

```js
readFile
immediate
timeout
```

#### Node.js 与浏览器的 EventLoop 差异

浏览器环境下，`microtask`的任务队列是每个`macrotask`执行完之后执行。

![](http://lynnelv.github.io/img/article/event-loop/ma(i)crotask.png)

而在 Node.js 中，`microtask`会在事件循环的各个阶段之间执行，也就是一个阶段执行完毕，就会去执行`microtask`队列的任务。

![](http://lynnelv.github.io/img/article/event-loop/ma(i)crotask-in-node.png)

故接下来这个例子在浏览器和 Node 环境下运行结果的不同就很好解释了

```js
setTimeout(()=>{
    console.log('timer1')

    Promise.resolve().then(function() {
        console.log('promise1')
    })
}, 0)

setTimeout(()=>{
    console.log('timer2')

    Promise.resolve().then(function() {
        console.log('promise2')
    })
}, 0)
```

浏览器端输出的结果为

```js
timer1
promise1
timer2
promise2
```

Node 环境下输出的结果为

```js
timer1
timer2
promise1
promise2
```


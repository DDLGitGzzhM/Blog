---
title: "[Acwing] 基础算法(十一) 欧拉函数"
description: 好饿啊
date: 2026-07-16
slug: acwing-basic-0x11
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "phi"
]
---

## 欧拉函数

什么是欧拉函数

对于一个数 N, `phi(N) = x` 其中 `x` 代表 `1~n` 中与`n` 互质的个数

互质的意思就是 `n 与 a` 没有公因子

### 算法思路

我们知道一个数 `n = p1^a1 * p2^a2 ... pn^an`

即对于 `p1` 有 `x1` 个数在 `1~n`中不是互质的因为他是因子，那么不互质的个数就是 `y1 = n - n/p1` 算个倍数

同理可得其他质因子的算法 从而推出 `phi = n * (1  - 1/p1) * (1- 1/p2)... (1-1/pn)`

### 代码

```c++
int phi(int x) {
  int res = x ;
  for(int i = 2; i <= x/ i ; i ++ ) {
      
    if(x % i == 0 ) {
      res = res - res/i;
      while(x % i == 0 ) x/=i ; 
    }
  }
if(x > 1) res = res  - res / x ;
  return res; 
}
```

### 时间复杂度 

`sqrtN`
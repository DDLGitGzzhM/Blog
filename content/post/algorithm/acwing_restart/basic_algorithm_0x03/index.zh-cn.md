---
title: "[Acwing] 基础算法(三) 前缀和&差分"
description: 当我们重新开始，我们以不再年轻
date: 2026-06-25
slug: acwing-basic-0x03
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "前缀和&差分"
]
---

## 前缀和

### 算法思路

1. 使用 Sum 数组累加计算数值数组的和

`sum[i] = sum[i-1] + a[i]`

从而可以很快的求出某个区间的和，例如

`sum[l~r] = sum[r] - sum[l-1]`

### 核心代码展示

````c++
    for(int i = 1; i <= n ; i ++ ) cin>>a[i];
    for(int i = 1; i <= n ; i ++) s[i] = s[i-1] + a[i];
    while(m -- ) {
        int l , r ;  cin >> l >> r;
        cout<<s[r] - s[l-1]<<endl;
    }
````


### 时间复杂度分析

1. 在只有一次区间询问的时候 和 for 循环直接计算无异 都是`o(n)`

但是在多次区间询问的时候可以提前把和计算出来从而使得 `o(n*m)` 变成 `o(n+m)`


### 感悟

小学数学



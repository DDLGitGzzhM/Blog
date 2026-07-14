---
title: "[Acwing] 基础算法(九) 质数"
description: 趋利避害，不得不承认学习更累
date: 2026-07-14
slug: acwing-basic-0x09
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "prime"
]
---

## 质数

质数的概念

1. 对于大于 1 的数，其因数只有他自己和1 那么这个数就是质数

## 试除法判定质数

### 算法思路
根据质数的定义出发我们可以很简单的想到 下面的形式，进行枚举来判断出来是否是质数

```
  for(int i = ; i <= n ; i ++ ) {
        if(n%i == 0) {
            return false ;
        }
  }
```

但是这种算法是 `on` 的

我们根据 `d | n` 那么 ` d/n | n` 可以得到 `d < n^2` 

这个怎么理解，例如 `2 | 8` 那么 `4 | 8` 因为最小的质数是 `2` 因此肯定存在这种情况

所以我们可以考虑 优化 `i` 的枚举, 从而达到 `sqrt(n)` 的时间复杂度
```
  for(int i = ; i <= n/ i ; i ++ ) {
        if(n%i == 0) {
            return false ;
        }
  }
```
### 时间复杂度 

On


## 分解质因数

### 算法思路

我们需要知道对于一个数 `n` 他可以拆成多个质数`p`幂的乘积 即 `n = p1^a1 * p2^a2.. pn^an` 

我们需要分解质因数，只需要从小到大枚举出能够整除的数即可,因为我们肯定会先遇到`2，3`这个质数 ，除完之后发现剩下的数也都是质数

### 代码

```
void SplitPrime(int x) {
    for(int i = 2 ;i <=  x / i ; i ++ ) {
        if(n % i == 0 ) {
            int s = 0 ;
            while(x % i == 0 ) {
                x /= i ;
                s ++ ;
            }
            cout<<i<<" "<<s<<endl;
        }
    }
    if(x > 1) {
        cout<<x<<" "<<1<<endl;
    }
}
```

### 时间复杂度

`logn ~ sqrt(n)` 之间

## 筛质数

### 埃及筛

### 算法思路

我们知道一个质数 `i` ，他的倍数 `2*i`,`n*i` 的因数肯定是 `i` 

所以我们可以根据这个性质过滤掉 `i` 的倍数

### 代码

```
void filterPrime() {
    int cnt = 0 ;
    for(int i  = 2; i <=  n ; i ++ ) {
        if(!st[i]) {
            for(int j = i ; j <= n ; j += i  ) st[j] = 1;
            cnt ++ ;
         }
    }
    cout<<cnt<<endl;
}
```
### 时间复杂度

`o (nlnln)`


### 线性筛

线性筛是对埃及筛的一个优化，我们每次都用 `最小质因子`进行优化

### 代码

```
void filterPrime() {
    int cnt = 0 ;
    for(int i = 2; i <= n; i ++ )  {
        if(!st[i]) prime[++cnt] = i ;
        for(int j = 1 ; prime[j] <= n / i  ; j ++ ) {
            st[prime[j] * i] = 1 ;
            if(i % prime[j] == 0) break; 
        }
    }
    cout<<cnt<<endl;
}
```

### 时间复杂度

on 
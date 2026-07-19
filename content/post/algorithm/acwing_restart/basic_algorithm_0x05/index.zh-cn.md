---
title: "[Acwing] 基础算法（五) 数据结构 链表"
description: 浪费完整的一天
date: 2026-07-10
slug: acwing-basic-0x05
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "链表"
]
---

## 链表

## 单链表

### 算法思路

我们使用 

`head` 存储头节点

`e[i]` 存储下标 i 节点的值

`ne[i]` 表示 `i` 的后继节点在哪

`idx` 表示当前点位

对于插入头部的操作 

`e[idx] = x, ne[idx] = head, head = idx++;` 

中间插入的操作

`e[idx] = x, ne[idx] = ne[k], ne[k] = idx++;` 

删除的操作

`ne[k] = ne[ne[k]];`

下面是一个演示过程 :

头插入

```
H 1:  e[0]=1, ne[0]=-1, head=0        → 链表: 1
H 2:  e[1]=2, ne[1]=0,  head=1        → 链表: 2 → 1
H 3:  e[2]=3, ne[2]=1,  head=2        → 链表: 3 → 2 → 1
```

调用 `Insert 3 5` 在第三个数后面插入5

```
e[3] = 5
ne[3] = ne[2] = 1    // 新节点先接上原来的后继
ne[2] = 3            // 节点 2 改指向新节点
```

调用 `Insert 4 4`

```
e[3] = 5
ne[3] = ne[2] = 1    // 新节点先接上原来的后继
ne[2] = 3            // 节点 2 改指向新节点
```

最终情况

```
逻辑链表:  head
              ↓
         ┌────┐    ┌────┐    ┌────┐    ┌────┐    ┌────┐
         │ 3  │ →  │ 5  │ →  │ 4  │ →  │ 2  │ →  │ 1  │ → NULL
         └────┘    └────┘    └────┘    └────┘    └────┘
         下标2     下标3     下标4     下标1     下标0

数组状态:
  i:    0    1    2    3    4
 e[i]:  1    2    3    5    4
ne[i]: -1    0    3    4    1
              ↑    ↑    ↑
              │    │    └─ head=2
              │    └─ ne[2]=3 指向节点5
              └─ ne[4]=1 指向节点2
```

### 完整代码

```c++
#include <bits/stdc++.h>
#define LL long long
using namespace std;
const int N = 1e5+10;
 
int head, e[N], ne[N], idx ;

void init() {
    head = -1 ;
    idx = 0 ;
}


void add_to_head(int x) {
    e[idx] = x;
    ne[idx] = head ;
    head = idx ++ ;
}

void add(int k ,int x) {
    e[idx] = x ;
    ne[idx] = ne[k];
    ne[k] = idx ++ ; 
}
// 1 , ne[0] = -1
// 2 , ne[1] = 0
// 3 , ne[2] = 1

// 5 , ne[4] = ne[3-1] = 1 ; 3, 1 (ne[3] = 5)

// 4 , ne[3] = 2


void remove(int k) {
    ne[k] = ne[ne[k]];
}

int main() {
    int n;cin>>n;
    init();
    for(int i = 1 ; i<= n ; i ++ ) {
        char op ;cin >> op ;
        if (op == 'H') {
            int x;cin>>x;
            add_to_head(x);
        }else if (op == 'D') {
            int x;cin>>x;
            if (!x) head = ne[head]; 
            else remove(x-1);
        }else if (op == 'I') {
            int k,x;cin>>k>>x;
            add(k-1,x);
        }
    }

    for(int i = head ; i != -1 ; i = ne[i]) {
        cout<<e[i]<<" ";
    }

    return 0;
}
```

## 双链表

### 算法思路

我们假设 `[0] [1]` 代表我们的左右端点

初始化的时候 `r[0] = 1 , l[1] = 0, idx = 2` 

对于插入操作

1. 我们需要给当前节点赋值
2. 并且使得当前节点的左右指针指向上下两个数 

    - `l[idx] = k, r[idx] = r[k]`

3. 同时修改两个被影响的指针

    - `l[r[k]] = idx, r[k] = idx` 

这是插入右端点的思路，插入左端点可以认为是在前一个节点插入右端点即`inser(l[k],x)` 

对于删除操作,我们需要把 当前节点的上一个节点 和 下一个节点互相建立关系

1. 将当前节点的左节点的右节点指向下一个节点

    - `r[l[k]] = r[k]`

2. 将当前节点的右节点的左节点指向上一个节点

    - `l[r[k]] = l[k]`

另外需要注意的是，我们一开始就使用了两个节点所以对于操作的节点我们应该认为是 `k+1` 

### 代码

```c++

int e[N],l[N],r[N],idx; 

void init() {
    r[0] = 1, l[1] = 0 ;
    idx = 2;
}

void add(int k,int x) {
    e[idx] = x;

    l[idx] = k ,r[idx] = r[k];

    l[r[k]] = idx, r[k] = idx;
    idx ++ ; 
}

void remove(int k) {
    l[r[k]] = l[k];
    r[l[k]] = r[k];
}

int main() {
    init() ;
    int n;cin>>n;
    for(int i = 1 ; i<= n ;i ++ ) {
        string op;cin>>op;
        if(op == "L") {
            int x;cin>>x;
            add(0,x);
        }else if(op == "R") {
            int x;cin>>x;
            add(l[1], x);
        }else if(op == "D") {
            int k;cin>>k;
            remove(k + 1);
        }else if(op == "IL") {
            int k,x;cin>>k>>x;
            add(l[k+1], x);
        }else {
            int k,x;cin>>k>>x;
            add(k+1,x);
        }
    }
    for(int i = r[0] ; i!= 1; i = r[i]) cout<<e[i]<<" ";
    return 0;
}
```
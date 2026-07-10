---
title: "[Acwing] 基础算法（五) 数据结构 单链表"
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

`e[idx] = x, ne[idx] = ne[k], ne[k] = idx++;`

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
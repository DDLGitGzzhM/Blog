---
title: "[Acwing] 基础算法(七) Tire 树"
description: 平平无奇的一天
date: 2026-07-12
slug: acwing-basic-0x07
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "Tire"
]
---

## Tire

### 算法思路

解决问题 :

解决单词统计类型的问题，或者是说 有多少 `prefix` 是以当前字符串为前缀的串

算法思路 ：

由于这种题目出现会控制单词长度，所以我们考虑开一个 `[N][26]` 树用于存储

1. 对于一个单词，相当于一个单边树
2. 对于 `abc` ,`abcd` 树会在 `c` 处进行分叉
3. 每个节点单独赋值 `idx`
4. 对于访问一个字符串我们可以从 根节点开始访问，对于其子串可以使用 `p = tire[p][u]` 的形式进行递归访问

### 代码展示

```c++

int son[N][26], n, idx ; 
int cnt[N];
char str[N];

void insert(char str[]) {
    int p = 0 ;
    for(int i = 0 ; str[i] ; i ++ ) {
        int u = str[i] - 'a';
        if(!son[p][u]) son[p][u] = ++idx ; 
        p = son[p][u];
    }
    cnt[p] ++ ;
}

int query(char str[]) {
    int p = 0 ;
    for(int i = 0 ; str[i] ; i ++ ) {
        int u = str[i] - 'a';
        if(!son[p][u]) return 0;
        p = son[p][u];
    }
    return cnt[p];
}

int main() {
  cin>>n ;
  while(n -- ) {
    char op[2];
    scanf("%s%s", op, str);
    if (*op == 'I') insert(str);
    else cout<<query(str)<<endl;
  }
}

```
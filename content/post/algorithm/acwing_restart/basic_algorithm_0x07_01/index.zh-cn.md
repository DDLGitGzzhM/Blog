---
title: "[Acwing] 基础算法（七) 并查集"
description: 平平无奇的一天
date: 2026-07-12
slug: acwing-basic-0x07-01
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "并查集"
]
---

## 并查集

### 算法思路

使用场景 

1. 将两个集合进行合并
2. 询问两个元素是否在一个集合中

我们很简单的可以想到判断两个元素是否在一个集合中可以使用`map`进行 `o1` 的判断，但是对于合并集合无法避免是 `o(n)` 的

因此我们考虑使用树的形式存储集合

1. 对于一个集合，其根节点代表整个集合编号 
2. 使用 `p[x]` 表示其父节点

对于一个单边集合

```
1 → 2 → 3 → 4
```

我们如果要找到 `1` 的集合，那么需要 从 `p[1],p[2],p[3]`一直寻找

但是我们可以考虑进行优化，对于找到根节点的集合，我们将其全部转移到根节点，即`路径压缩`

```
1 ──┐
2 ──┼──→ 4
3 ──┘
```

### 代码

其中 `p[x] = find(p[x])` 代表路径压缩

```c++
int p[N] ;

int find(int x) {
    if(p[x]!= x) {
        return p[x] = find(p[x]);
    }
    return p[x];
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n,m;cin>>n>>m;
  for(int  i = 1 ; i <= n ; i ++ ) {
     p[i] = i ;
  }
  for(int i = 1 ; i <= m ; i ++ ) {
    char op;cin>>op ;
    int a,b;cin>>a>>b;
    int fa = find(a);
    int fb = find(b);
    if(op == 'M') {
        p[fa] = fb;
    }else if(op == 'Q') {
        if (fa == fb) {
            cout<<"Yes"<<endl;
        }else {
            cout<<"No"<<endl;
        }
    }
  }
}
```
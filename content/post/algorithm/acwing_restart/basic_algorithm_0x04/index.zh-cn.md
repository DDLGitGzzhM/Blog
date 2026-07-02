---
title: "[Acwing] 基础算法（四) 离散化&区间合并"
description: 我就这么走着,大家走这么走着
date: 2026-07-02
slug: acwing-basic-0x04
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "离散化&区间合并"
]
---

## 离散化

## 整数离散化

### 算法思路

算法解决的问题是

1. 值域很大, 但是实际操作区域很小 的题目 

例如 :

1. 在 1e9 的区间范围上 操作 3e5 次操作然后进行求和

整个思路如下 

1. 先将需要 操作的数 和 查询的数 放到一个队列里面
2. 给队列排序去重
3. 通过二分获取每个值应该存在的下标

### 核心代码展示



````c++
    typedef pair<int,int> PII ;
    const int N = 3e5 + 10 ;
    int n , m ;
    int a[N],s[N];

    vector<int> alls ;
    vector<PII> add,query ;
        
    int find(int x) {
        int l = 0 , r = alls.size() - 1;
        while(l < r) {
        int mid = (l + r) >> 1;
            if(alls[mid] >= x) r = mid ;
            else l = mid + 1;
        }
        return r + 1 ;
    }
        cin>>n>>m;
    for(int  i = 1; i <= n ; i ++ ) {
        int x,c; cin >>x>>c;
        add.push_back({x,c});
        alls.push_back(x);
    }
    
    for(int i = 1 ; i <= m ; i ++ ) {
        int l,r;cin>>l>>r;
        query.push_back({l,r});
        alls.push_back({l});
        alls.push_back({r});
    }

    sort(alls.begin(), alls.end());
    alls.erase(unique(alls.begin(), alls.end()), alls.end());
    
    for(auto item : add) {
        int x = find(item.first);
        a[x] += item.second;
    }
    
    for (int i = 1; i <= alls.size(); i ++ )  s[i] = s[i-1] + a[i];
    
    for(auto item : query) {
        int l = find(item.first) ;
        int r = find(item.second) ;
        cout<<s[r] - s[l-1]<<endl;
    }
````

### 时间复杂度分析 

1. 需要遍历数组 On

### 感悟

这次学到了一下新玩意

`typedef` 可以定义 `pair` 

以及 `sort` 可以直接对数组进行排序

`vector.erase(unique(), vector.end())` 可以去重

````c++
typedef pair<int,int> PII ;
sort(alls.begin(), alls.end());
alls.erase(unique(alls.begin(), alls.end()), alls.end());
```c++


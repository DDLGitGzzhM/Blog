---
title: "[Acwing] 基础算法(八) 堆"
description: 很难，但是一切正常
date: 2026-07-13
slug: acwing-basic-0x08
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "heap"
]
---

## Heap

### 算法思路

我们使用一维数组来表示一个堆,堆的性质是一个完全二叉树，其中根是最小值，左右节点均小于父节点

我们使用 `x表示根节点，则 2*x表示左节点 , 2*x+1 表示右节点` 

考虑

1. 插入一个数
2. 删除最小值
3. 求最小值

对于插入一个数 :

1. 因为是使用一维数组进行存储的，所以插入的数会在末尾，我们需要考虑进行 `up` 操作，将其和其父节点进行比较，如果比父节点小那么交换

```c++
void up(int u ) {
    while(u/2 && h[u/2] > h[u]) {
        heap_swap(u/2,u);
        u /= 2 ;
    }
}
```

2. 对于删除最小值

因为最小值在 `h[1]` 所以考虑删除的时候，应该交换`h[size]` ，然后`size--` 最后将 `size` 进行一次`down`操作

`down`操作也是很简单就能想到是和 `左右节点进行比较` ,如果比左右节点大那么进行交换


### 代码

```c++
int n,m;
int h[N],sz ;

void down(int x) {
    int t = x;
    if(x * 2 <= sz && h[t] > h[x * 2]) t = x * 2;
    if(x * 2 + 1 <= sz && h[t] > h[x*2 + 1] ) t = x*2+ 1;
    if(h[x] != h[t]) {
        swap(h[x],h[t]);
        down(t);
    }
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  cin>>n>>m;
  for(int i = 1; i <= n ; i ++ ) cin>>h[i];
  sz = n ;
  for(int i = n/2; i ; i -- ) down(i);
  while(m -- ) {
    cout<<h[sz]<<" ";
    h[1] = h[sz];
    sz -- ;
    down(1);
  }
  return 0;
}

```


### 时间复杂度分析

建树的时候是 `o(n)` 的 遍历树的时候 是 `ologn`

## 模拟堆

在普通堆的基础上增加了

1. 删除第 k 个数
2. 修改第 k 个数

对于删除 第 k 个数

1. 我们需要考虑存储 , 第k个数 对应在 `heap`中的下标是什么 即 `ph[k]`
2. 同时因为涉及到交换，我们需要在 `o(1)` 的时间复杂度知道  堆下标`i = 2*x? 2*x+1` 上堆元素，是第几次插入的 `hp`

因为如果不知道 `hp 元素`

我们在交换的时候会遇到 

```
原来：第 m 次插入在位置 a  →  ph[m] = a
      第 n 次插入在位置 b  →  ph[n] = b

交换后：第 m 次插入到了 b  →  ph[m] = b
        第 n 次插入到了 a  →  ph[n] = a
```
这种奇异的问题，原本第`m`次插入的`a` 变成了 第`n`次插入的

除非我们进行 `oN` 的处理

```
// 没有 hp 时，每次 swap 都要扫一遍
for (int k = 1; k <= m; k++)
    if (ph[k] == a) ph[k] = b;
    else if (ph[k] == b) ph[k] = a;
```

但是我们如果引入了 `hp` 后只需要进行 更换即可

```
void heap_swap(int a, int b)
{
    swap(ph[hp[a]], ph[hp[b]]);  // ph[hp[a]]=a, ph[hp[b]]=b → 交换后变成 b 和 a
    swap(hp[a], hp[b]);
    swap(h[a], h[b]);
}
```

### 代码

```

int n,m;
int h[N],sz , hp[N], ph[N];

void heap_swap(int a,int b)  {
    swap(h[a],h[b]);
    swap(ph[hp[a]], ph[hp[b]]);
    swap(hp[a],hp[b]);
}

void down(int x) {
    int t = x;
    if(x * 2 <= sz && h[t] > h[x * 2]) t = x * 2;
    if(x * 2 + 1 <= sz && h[t] > h[x*2 + 1] + 1) t = x*2+ 1;
    if(x != t) {
       heap_swap(x,t);
    }
    down(t);
}

void up(int u ) {
    while(u/2 && h[u/2] > h[u]) {
        heap_swap(u/2,u);
        u /= 2 ;
    }
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int n;cin>>n;
  while(n -- ) {
    string op;cin>>op;
    if(op == "I") {
        int x;cin>>x;
        h[++sz] = x ;
        m ++ ;

        ph[m] = sz ;
        hp[sz] = m ;

        up(sz);
    }else if(op == "PM") {
        cout<<h[1]<<endl;
    }else if(op == "DM") {
        heap_swap(1,sz);
        sz -- ;
        down(1);
    }else if(op == "D") {
        int k;cin>>k;
        k = ph[k];
        heap_swap(k,sz);
        sz -- ;
        up(k);
        down(k);
    }else {
        int k,x;cin>>k>>x;
        k = ph[k];
        h[k] = x;
        up(k);
        down(k);
    }
  }
  return 0;
}

```

### 一些感想

好难，说实话 涉及到一些指针的来回跳动就完全不会了
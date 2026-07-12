---
title: "[Acwing] 基础算法(六) 数据结构 栈&队列"
description: 平平无奇的一天
date: 2026-07-11
slug: acwing-basic-0x06
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "栈&队列"
]
---

## 栈

### 算法思路

我们使用 `stk[N],tt` 表示栈数组和栈顶指针

对于插入操作 `stk[++tt] = x ` 即可

对于查询是否为空的操作判断 `tt != 0` 即可

对于删除操作 `tt--` 即可

比较简单的一个模拟

待会中午约了散伙饭先收拾去了~

### 代码

```c++
bool checkEmpty() {
    return (tt == 0); 
}

void push(int x) {
    stk[++tt] = x; 
}

int pop() {
    int x = stk[tt];
    tt -- ;
    return x; 
}

int query() {
    return stk[tt];
}

int main() {
    int m; cin>>m ;
    while(m -- ) {
        string op;cin>>op;
        if(op == "push") {
            int x;cin>>x;
            push(x);
        }else if (op == "pop")  {
            pop();
        }else if(op == "empty") {
            if (checkEmpty()) {
                cout<<"YES"<<endl;
            }else {
                cout<<"NO"<<endl;
            }
        }else if(op == "query") {
            cout<<query()<<endl;
        }
    }
    return 0;
}
```

## 队列

### 算法思路

我们通过 `hh,tt` 表示队头和队尾, 维护一段连续区间

对于弹出操作，我们使用 `hh++`

对于插入操作, 我们使用 `q[++tt]=x` 

对于查询是否为空的操作，我们使用 `hh<=tt`

### 代码

```c++
int q[N];

int tt,hh;

void init() {
    tt = -1;
}

bool empty() {
    return (hh <= tt);
}

void add(int x) {
    q[++tt] = x;
}

void pop() {
    hh ++ ;
}

int query() {
    return q[hh];
}


int main() {
    init();
    int m;cin>>m;
    while(m -- ) {
        string op;cin>>op;
        if(op == "push") {
            int x;cin>>x;
            add(x);
        }else if(op == "pop"){
            pop();
        }else if(op == "empty") {
            if(empty()) {
                cout<<"NO"<<endl;
            }else {
                cout<<"YES"<<endl;
            }
        }else if(op == "query") {
            cout<<query()<<endl;
        }
    }
    return 0;
}
```

## 单调栈

### 算法思路

顾名思义，我们维护的是一个 `单调递增` or `单调递减` 的一个内容

一般情况下我们会考虑一种提醒题型,即找到 `当前数左边比自己小的数是什么` 

那么我们可以考虑维护一个 `maxValue` 是当前数的栈,对于大于自己的数都出栈，从而保证整个栈的值是递增的

### 代码

```c++
int main() {
    cin>>n;
    for(int i = 1; i <= n ;i ++ ) {
        int x;cin>>x;
        while(tt&&stk[tt] >= x) {
            tt -- ;
        }
        if(!tt) {
            cout<<-1<<" ";
        }else {
            cout<<stk[tt]<<" ";
        }
        stk[++tt] = x;
    }
    return 0;
}
```

### 时间复杂度分析

对于我们想要解决这个问题，暴力做法是 `n^2` 的

但是如果我们对于 `a3>a5` 的话，我们会发现我们永远用不到 `a3` 所以我们并不需要单独去遍历他，在最坏情况下也是 `2n` 的

## 单调队列

### 算法思路

同样以 `滑动窗口举例` ,我们需要快速的求出一个固定窗口的最大最小值

我们对于 `[1 3 -1 -3 5 3 6 7]` 这个窗口,在`[3,-1,-3]` 窗口大小为 `3` 的时候，我们可以发现，其实`-3`是最小值，其中`3,-1`都没有用，因为后面的序列也用不到

所以我们可以维护一个最小值的窗口

考虑

1. 当队头超出窗口 那么移出队头
2. 当队内元素大于当前数，那么移除当前元素 。 因为我们维护的是一个从小到大的序列，所以这里从队尾开始删除
3. 然后把当前数插入进去
4. 并且窗口有输出的时候进行输出

### 代码

```go
int main() {
    cin>>n>>k;
    int hh = 0 ,tt = -1;
    for(int i = 1 ; i <= n ; i ++ ) cin>>a[i];
    for(int i = 1; i <= n ; i ++ ) {
        if(hh <= tt && i - k  >= q[hh]) hh ++ ;
        while(hh <= tt && a[q[tt]] >= a[i]) tt -- ; // 5 6 2
        q[++tt] = i ;
        if(i-k >= 0) cout<<a[q[hh]]<<" "; 
    }
    hh = 0, tt = -1;
    cout<<endl;

    for(int i = 1; i <= n ; i ++ ) {
        if(hh <= tt && i - k  >= q[hh]) hh ++ ;
        while(hh <= tt && a[q[tt]] <= a[i]) tt -- ; // 5 6 2
        q[++tt] = i ;
        if(i-k >= 0) cout<<a[q[hh]]<<" "; 
    }
}
```
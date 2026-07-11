---
title: "[Acwing] 基础算法（五) 数据结构 栈&队列"
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
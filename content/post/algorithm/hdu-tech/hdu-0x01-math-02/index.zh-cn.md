---
title: "[Hdu] 数学基础 day2"
description:  数学基础 0x02
date: 2025-05-25
slug: hdu-0x01-math-02
image: icpc-title.png
categories:
    - algorithm
tags: [
  "hdu-icpc",
]
---

## 快速幂

### 求 A^B 的最后三位数表示的整数

#### 输入格式
- 输入数据包含多个测试实例
- 每个实例占一行，由两个正整数A和B组成（1 ≤ A,B ≤ 10000）
- 如果A=0且B=0，则表示输入结束，不做处理

#### 输出格式
- 对于每个测试实例，输出A^B的最后三位表示的整数
- 每个输出占一行

#### 输入输出示例

| 输入样例         | 输出样例 |
|------------------|----------|
| 2 3              | 8        |
| 12 6             | 984      |
| 6789 10000       | 1        |
| 0 0              | (无输出) |

**算法讲解 :** 
1. 对于 `123^(234)`. 我们可以优化成 `(123^2)^117`, 再进一步优化成 `((123^2) * 123 )^116`
2. 同理往下, 我们可以发现, 我们的`计算量由次幂来控制`, 同时我们可以根据就性质来操作次幂的优化
   3. 对于奇数 我们只需要拆成 `ans = ans * a` 的形式
   4. 对于偶数 我们只需要拆成 `a = a * a` 的形式

````cgo 
#include <bits/stdc++.h>
using namespace std;
int qmi(int a, int b) {
    int ans = 1 ; 
    while(b != 0) {
        if(b&1) ans = ans * a % 1000 ; 
        a = a  * a % 1000 ; 
        b = b >> 1; 
    }
    return ans % 1000 ; 
}
int main() { 
    int a, b; 
    while(1) {
        cin>>a>>b;
        if (a  == 0 && b == 0 ) {
            break ; 
        }
        cout<<qmi(a,b)<<endl;
    }
    return 0;
}
````

[vj题目链接](https://vjudge.net/problem/HDU-2035)

## todo 
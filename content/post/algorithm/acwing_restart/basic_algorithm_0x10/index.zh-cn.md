---
title: "[Acwing] 基础算法(十) 约数"
description: 难难难
date: 2026-07-15
slug: acwing-basic-0x10
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "divisor"
]
---

## 约数

约数的概念 : 能被整除的数叫做约数 即 `d|n` ,`d`是 `n` 的约数

### 试除法求约数

### 算法思路

我们在 `试除法求质数` 的时候，知道 如果`d|n`那么`d/n | n` 因为一个数的约数最小都是 `2`倍

所以我们可以通过 `for(int i = 2; i <= x/i ; i ++ )` 的方式寻找 约数

不过需要注意的是 对于 `1` 可以是任何数的约数

所以我们这里的循环需要从 `1`  开始取


### 代码

```c++

vector<int> getDiv(int x){ 
    vector<int> ans ;
    for(int i = 1; i <= x/ i ; i ++ ) {
        if(x % i == 0) {
            ans.push_back(i);
            if(i != x /i ) {
                ans.push_back(x/i);
            }
        }
    }
    sort(ans.begin(),ans.end());
    return ans ;
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  cin>>n;
  while(n -- ) {
    int x;cin>>x;
    auto ans = getDiv(x);
    for(auto res : ans) {
        cout<<res<<" ";
    }
    cout<<endl;
  }
  return 0;
}

```

### 时间复杂度 

O sqrtN

### 约数个数

### 算法思路

我们知道一个数可以拆分成 `n = p1^a1*p2^a2*p3^a3...pn^an` 这是质因数分解的章节学到的

同时我们可以知道 对于 `p1` 的幂，取值有 `0~a1` 种，因为剩下的`p2...pn`可以被整除

所以根据排列 我们知道约数个数 为 `(a1+1)*(a2+1) ... (an+1)`

### 代码

```c++
  int n;
    cin>>n;

    unordered_map<int,int> primes;//映射函数

    while(n--)
    {
        int x;
        scanf("%d",&x);

        for(int i=2;i<=x/i;i++)
        while(x%i==0)
        {
            primes[i]++;
            x/=i;//方便求得约数的数量
        }

        if(x>1) primes[x]++;//x的最大公约数可能大于sqrt(x);
    }

    long long res=1;
    for(auto p:primes) res=res*(p.second+1)%mod;//将统计出来的数按照由图中公式所得出来的结论得出答案

    printf("%lld\n",res);
```

### 时间复杂度

o sqrtN

### 约数之和

### 算法思路

题目求的是 所有约数乘积的和

即 `(p0^a1 + p1^a2 .... pn^an+1) * (p?1^b1 + p?2^b2 ... p?n^bn)`

根据乘法原理我们可以提取出来 

`(p0^0 + .. p0 ^(a1 + ???) ) * (pk^0 + ...) `的形式

因此我们只需要做一次质因数分解，然后根据次数进行求质数幂次的乘积和即可


### 代码

```c++
#include <bits/stdc++.h>
#define LL long long
using namespace std;
const int N = 1e6+10, mod = 1e9+7;
int n;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  cin>>n;
  unordered_map<int,int> mp ;
  while(n -- ) {
    int x;cin>>x;
    for(int i = 2; i <= x / i; i++) {
        while(x % i == 0) {
            x /= i;
            mp[i]++;
        }
    }
    if(x > 1) mp[x]++;
  }
  LL ans  = 1;
  for(auto x : mp) {
    LL t = 1; 
    int a = x.second ; 
    while(a -- ) {
        t = (t * x.first + 1) % mod ;
    }
    ans = ans%mod * t %mod ;
    
  }
  cout<<ans<<endl;
  return 0;
}

```

### 时间复杂度

o sqrtN

### 最大公约数

### 算法思路

我们知道 如果 `x | a` 并且 `x | b` 那么 `x | a * y + b * k` 

同理对于 `gcd(a,b) = gcd(b, a % b)`  为什么等式成立 ？ 因为  `x | b` 那么 `x | a + c * b` 这里的 `c` 就是 `-a/b`

因为 `x | a + c *b - c*b` 等式成立 所以 `x|a`成立

### 代码

```c++
int gcd(int a,int b) {
  return b ? gcd(b , a %b) : a; 
}

```

### 时间复杂度

on 


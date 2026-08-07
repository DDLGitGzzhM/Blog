---
title: "[LeetCode][hot100] 滑动窗口"
description:  滑动窗口
date: 2025-08-07
slug: leetcode-slide-window
image: img.png
categories:
    - algorithm
    - time-line
tags: [
  "leetcode-hot100",
]
---
## 3. 无重复字符的最长子串

[无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/description/?envType=study-plan-v2&envId=top-100-liked)

```cpp
#include <bits/stdc++.h>

const int N = 1e5 + 10 ;
int mp[N];

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        memset(mp,0,sizeof(mp));
        int ans =  0 ;
        int n = s.size();

        int j = 0 ;
        for(int i = 0 ; i < n ; i ++ ) {
            mp[s[i]] ++ ;
            while(mp[s[i]] > 1 && j < i)  {
                mp[s[j ++ ]]  -- ; 
            }
            ans =max(ans , i - j   + 1);
        }
        return ans ; 
    }
};
```

### 心路历程

说实话挑着滑动窗口做的，但是这道题是一个双指针的题 。 没什么难度 直接就做了 。 另外 `leetcode` 这种需要 人眼 debug 的模式 确实很刺激 。

一开始写的是 `mp[j] > 1` 该成了 `mp[s[j]]` 后面 自测还是不对 又改成了 `mp[s[i]]` 人眼 `debug` 加缺少深度思考 确实很容易写偏


## 438. 找到字符串中所有字母异位词


[找到字符串中所有字母异位词](https://leetcode.cn/problems/find-all-anagrams-in-a-string/?envType=study-plan-v2&envId=top-100-liked)

```cpp
const int N = 3e4 + 10 ;
int tt , hh ; 
int cnt[27],cnts[27];
int q[N];

void init() {
    tt = - 1;
    hh = 0 ;
    memset(cnt,0,sizeof(cnt));
    memset(cnts,0,sizeof(cnts));
}

bool check() {
    for(int i = 0 ; i < 26 ; i ++ ) {
        if(cnt[i] != cnts[i]) {
            return false; 
        }
    }
    return true ;
}


class Solution {
public:
    vector<int> findAnagrams(string s, string p) {
        init();
        int n = s.size();
        int k = p.size();
        vector<int> ans ;
        for(int i  = 0 ; i < k ; i ++ ) {
            cnt[p[i]- 'a'] ++ ;
        }

        for(int i = 0 ; i < n ; i ++ ) {
            q[++tt] = s[i];
            cnts[s[i] - 'a']++;
            // 2. 超过 k 则左端出
            if (tt - hh + 1 > k) {
                cnts[q[hh++] - 'a']--;
            }
            // 3. 长度刚好 k 再判断
            if (tt - hh + 1 == k && check()) {
                ans.push_back(i - k + 1);
            }
        }
        return ans ; 
    }
};

// 固定窗口 len(p)
// 寻找 cnt[p...] = cnt[ans , ans + len(p)]  这里看着是 O(n) 的 
// 找的是异位词 如果是同位词 感觉就像是 KMP里面的next 数组了

// 需要有一个算法能够快速 check cnt , 外面的循环肯定是 On 的
// 我们只 check 26个字母。 那么就是 On * 26 只需要通过滑动窗口固定一下窗口即可，当成为队列的时候 check 一下
```

### 心路历程

这道题上来就压力拉满了 还以为要我写 `kmp next` 数组的求法 但是想了一下我们可以暴力的使用 `cnt` 进行遍历

不过一开始写滑动窗口的代码很傻逼

我一开始是这样子处理的,如果队列 把当前字符插入到队列里面 。 如果队列满了那么就判断 。 

我这里的判读逻辑导致我遗漏了 当前满节点的这个值 。

后来优化了一下代码成上面的样子 之后就完成了

```c++
        for(int i = 0 ; i < n ; i ++ ) {
            if(tt < hh || (tt - hh  + 1 < k ))  {
                q[++tt] = s[i]; // 空的话入队列 或者 窗口比较小
                cnts[s[i] - 'a'] ++ ;
            }else { // 队列已经满了
                if(check()) {
                    ans.push_back( i -  k  + 1); 
                }
                cnts[q[hh ++ ] - 'a'] -- ; // 队头弹出队列
            }   
        }
```

实际可以改成

```c++
        for(int i = 0 ; i < n ; i ++ ) {
            if(tt < hh || (tt - hh  + 1 < k ))  {
                q[++tt] = s[i]; // 空的话入队列 或者 窗口比较小
                cnts[s[i] - 'a'] ++ ;
            }else { // 队列已经满了
                if(check()) {
                    ans.push_back( i -  k); 
                }
                cnts[s[i] - 'a'] ++ ;
                q[++tt] = s[i];
                cnts[q[hh ++ ] - 'a'] -- ; // 队头弹出队列
            }   
        }

        if(check()) {
            ans.push_back( n -  k); 
        }
```
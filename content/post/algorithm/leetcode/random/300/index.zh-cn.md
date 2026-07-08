---
title: "[LeetCode] 300. 最长递增子序列"
description:  https://leetcode.cn/problems/longest-increasing-subsequence/description/
date: 2026-07-08
slug: leetcode-300
categories:
    - algorithm
    - time-line
tags: [
  "leetcode-hot100",
]
---
## 题目

给你一个整数数组 nums ，找到其中最长严格递增子序列的长度。

子序列 是由数组派生而来的序列，删除（或不删除）数组中的元素而不改变其余元素的顺序。例如，`[3,6,2,7]` 是数组 `[0,3,1,6,2,2,7]` 的子序列。

 
示例 1：

输入：`nums = [10,9,2,5,3,7,101,18]`
输出：4
解释：最长递增子序列是 `[2,3,7,101]`，因此长度为 4 。
示例 2：

输入：`nums = [0,1,0,3,2,3]`
输出：4
示例 3：

输入：`nums = [7,7,7,7,7,7,7]`
输出：1
 

 ## 思路

 这道题的数据范围很小，可以考虑暴力，我们很想当然可以想到 

 `f[i]` 表示当前以 `i` 结尾的最长子序列是是多少, 那么答案就是 `f[i] = f[j] + 1 (a[j] < a[i] , j ~ (0~i))`

 这样子的思路是 `N^2` 的

 我们改变思路将 `f[i]` 表示当前长度为`i`的最长子序列，结尾最小的数是`f[i]` 

 那么对于 `a[i]` 来说，我们只需要找到第一个能插进去的位置即可，即找到一个 比 `a[i]` 大的最小的数 。这样子我们可以优化第二层的时间复杂度为`O(logN)`

 简单拿一组数据来说 `101,102,103,104,2` , 当我们遍历到 `104` 的时候我们发现只能找到 `f[4]` 说明它可以接到 `f[4]`后面，即`f[5]  = a[i]`

 但是当我们遍历到 `2` 的时候，发现只能找到`F[0]` 说明只能找到长度为 `1` 的序列，那么他只会更新`F[1] = a[i]`

 ## 代码


```c++
const int N  = 2e5+10;
int q[N];
class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        int n = nums.size();
        int len = 0 ;
        for(int i = 0 ;i < n ; i ++ ) {
            int l = 0, r = len ;
            while(l < r) {
                int mid = l+r+1>>1;
                if(q[mid] < nums[i]) l = mid;
                else r = mid - 1;
            }
            len = max(len,r + 1);
            q[r+1] = nums[i];
        }
        return len ;
    }
};
```
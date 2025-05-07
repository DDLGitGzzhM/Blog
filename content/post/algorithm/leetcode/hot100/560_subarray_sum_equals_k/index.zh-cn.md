---
title: "[LeetCode][hot100] 560. 和为 K 的子数组"
description:  给你一个整数数组 nums 和一个整数 k ，请你统计并返回 该数组中和为 k 的子数组的个数
date: 2025-04-29
slug: leetcode-560
image: img.png
categories:
    - algorithm
tags: [
  "leetcode-hot100",
]
---
## 题目
> 给你一个整数数组 nums 和一个整数 k ，请你统计并返回 该数组中和为 k 的子数组的个数 。
子数组是数组中元素的连续非空序列。
> 
>示例 1：
> 
>输入：nums = [1,1,1], k = 2 
> 
>输出：2
>
>示例 2：
>
>输入：nums = [1,2,3], k = 3
>
>输出：2
>
>提示：
>
>1 <= nums.length <= 2 * 104
>
>-1000 <= nums[i] <= 1000
>
>-107 <= k <= 107

## 思路
1. 对于 需要找到 `X + Y  = K` 的模型，我们统一想到使用 `map[X-K] = Y` 的优化，可以将 `n^2 -> O(n)`


2. 对于这题我们需要把子数组和看为`X`, 我们计算前缀和 `SUM[i]` 表示，以 `i` 结尾前面所有数值的和. 因为我们知道 `K` 所以我们并不需要去找到我们的 `Y`, 我们只需要保证，我们能全量的枚举出`X` 即 `SUM[i]`


3. 因此我们只需要`ans = ans + map[sum[i] - K]` 即可

tips :
1. 当我们 `sum[1] - K == 2` 并且在 `sum[3] - K == 2` , 那么我们是否重复计算了 `[0~3]` 的某些子数组呢 ?

   
结论是 : 我们 `sum[3]-K == 2` 的成立是由于引入了`A[2]` , 因此不存在重复计算


````go
func subarraySum(nums []int, k int) int {
    count := make(map[int]int)
    count[0] = 1
    preSum := 0 
    ans := 0 
    for  _ , v := range nums  {
        preSum += v
        ans += count[preSum - k]
        count[preSum] ++ 
    }
    return ans 
}
````
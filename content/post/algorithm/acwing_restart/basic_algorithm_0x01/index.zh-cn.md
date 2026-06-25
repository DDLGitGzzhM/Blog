---
title: "[Acwing] 基础算法(一) 排序"
description: 当我们重新开始，我们以不再年轻
date: 2026-06-17
slug: acwing-basic-0x01
categories:
    - algorithm
    - time-line
tags: [
  "acwing",
  "排序"
]
---

## 方法

课上: 学习 ``主要思想`` 

课下: 
1. 理解代码,背过代码
2. 根据题目默写代码 ( 3 ~ 5 次 )

## 快速排序

### 算法思路

1. 寻找区间内的随机一个值, 将其当作中间值
2. 遍历当前区间, 将区间分为 ``[l ~ x] [x ~l]`` 的形式
3. 递归处理区间, 将大区间拆分成多个小区间进行排序

### 核心代码展示

````cpp
void quick_sort(int q[], int l, int r) {
    if (l >= r) return;
    int i = l - 1, j = r + 1, x = q[(l + r) >> 1];
    while (i < j) {
        do i++; while (q[i] < x);
        do j--; while (q[j] > x);
        if (i < j) swap(q[i], q[j]);
    }
    quick_sort(q, l, j);
    quick_sort(q, j + 1, r);
}
````

### 时间复杂度分析

由于区间是对半拆分的 最多只有 logN 层

但是每层都需要进行一次 `while(i<j)` 的遍历 每层需要 `o(n)` 的时间复杂度

所以总时间复杂度是 `o nlogn`

最坏情况下 :

例子 A：已有序 + 基准取 q[l]

数组：[1, 2, 3, 4, 5]，每次 pivot = 最左边：
````shell
第1次: [1 | 2,3,4,5]     左 1 个，右 4 个
第2次:      [2 | 3,4,5]  右 4 个继续
第3次:           [3 | 4,5]
...
````
分区大小每次都是 ``n, n-1, n-2, …, 1``
总工作量 ``n + (n-1) + (n-2) + … + 1 = n(n+1)/2 = O(n²)``

理想情况 

````shell
        n
      /   \
    n/2   n/2
   /  \   /  \
 n/4 ...        高度 ≈ log n，每层总工作量 n
````

最坏情况 

````shell
n
 \
  n-1
   \
    n-2
     \
      ...    链状，高度 n，总工作量 n+(n-1)+... = O(n²)
````

### 犯错

一开始因为不喜欢 ``do while`` 的形式，所以自己单独写了一个 ``while`` 的形式 

后续发现一直 TLE 后面看了一下 在两个相同数的时候，如果先进行判断然后再进行位移指针会卡住程序的运行

```shell
初始: i=1, j=2

第 1 轮:
  左扫: 67 < 67 ? 否 → i 停在 1
  右扫: 67 > 67 ? 否 → j 停在 2
  swap(67, 67) → 数组不变

第 2 轮:
  i 还是 1, j 还是 2  → 完全一样 → 永远循环
```
----

```shell
初始: i=0, j=3

第 1 轮:
  do i++ → i=1, q[1]<67? 否
  do j-- → j=2, q[2]>67? 否
  swap(67,67) → 数组不变

第 2 轮:
  do i++ → i=2   ← 强制从 1 走到 2
  do j-- → j=1   ← 强制从 2 走到 1
  现在 i=2, j=1 → i<j 为假 → 退出

递归 (1,1) 和 (2,2) → 结束
```
---

```go
void quick_sort(int q[], int l , int  r) {
	if( l >= r ) {
		return ;
	}
	int x = q[l] ,  i = l , j = r ;
	while(i < j) {
		while(q[i] < x) i ++ ;
		while(q[j] > x)j -- ;
		if(i < j) {
			swap(q[i], q[j]); 
		}
	}
	quick_sort(q, l , j );
	quick_sort(q, j + 1, r);
	return ;
}
```

### 感悟

记录一下在上班的时候 能够听满 30 分钟的课程 之前可是想都不敢想的

![img.png](img1.png)

## 第二次默写

第二次默写失败了好多次 

1. `signal: bus error` 这个错误 指的是程序访问了不合法的内存地址 因为我代码总累加写错了

变成了 `j++` 

````c++
void quick_sort(int q[],int l , int r) {
// ... 
do j ++ ; while(q[j] > x) ;

swap(q[i],q[j]);

}

// ...

}

````

2. 第二个点就是 需要保证 `i < j ` 才能够进行 `swap` 不然会把原来已经排序好的程序重新打乱
3. 边界的选取

在竞技编程中，为了防错，大家通常死记硬背以下两套固定组合，千万不要交叉使用：

组合一（最常用，推荐）：向下取整配 j

基准值：`x = q[(l + r) >> 1];`

划分线：j

递归：`quick_sort(q, l, j);` 和 `quick_sort(q, j + 1, r);`

组合二：向上取整配 i - 1

基准值：`x = q[(l + r + 1) >> 1];`

划分线：`i - 1`

递归：`quick_sort(q, l, i - 1);` 和 `quick_sort(q, i, r);`


## 归并排序

### 算法思路

1. 递归处理大区间一分为2为小区间
2. 双指针合并两个小区间 ， 保证数组有序

### 核心代码展示

````c++ 
void merge_sort(int q[], int l, int r) {
	if(l >= r) return ;
	int mid = (l + r) >> 1; 
	merge_sort(q,l,mid) , merge_sort(q,mid + 1, r) ;
	
	int k = 0 , i = l , j = mid + 1;  

	while(i <= mid && j <= r) {
		if(q[i] <= q[j]) temp[++k] = q[i ++ ] ;
		else temp[++k] = q[j ++ ];
	}
	while(i <= mid) temp[++k] = q[i ++ ];
	while(j <= r) temp[++k] = q[j ++] ;
	
	for(int i = l , j = 1 ;  i <= r ; i ++ , j ++ ) q[i] = temp[j];
}
````

### 时间复杂度分析

1. 递归处理最多拆分成  logN 个区间，每个区间最多进行 N 次

最坏情况下都排序也是 nlogn 的

### 感悟

归并排序的过程很好理解，但是实际写代码下来 指针很多 `i,j,k,mid` ，然后还加上递归回溯的处理，导致整个过程比较难理解
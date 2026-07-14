---
title: "[webook-tidy] Golang 基础语法"
description: 学习项目上的一些总结
date: 2026-07-14
slug: webook-summary-0x01
categories:
    - summary
    - time-line
    - program
tags: []
---


## 函数式编程

Golang 支持定义 方法作为变量即  `myFunc = func(){}, myFunc()` 的形式

同样方法也可以作为返回值

```go
func Say() func(name string) string {
    return func(name string)string {
        return "hello," + name
    }
}
```

### 闭包

closure  ： 方法+它绑定的上下文

组成如下 : 

1. 方法
2. 运行时上下文 : 即 name 变量

```go
func Closure(name string) func() string {
	return func() string {
		return "hello " + name
	}
} 
```

闭包如果使用不当会造成`内存泄漏`, 因为外层 Func 的name变量被直接使用传递出去了 。 如果一个对象被闭包引用，他是不会被`垃圾回收`的


### 不定参数

Golang 支持不定参数传递即,使用`...`进行 ，不定参数可以当作切片进行使用

```go
func hanlder(name string ,alias ...string) {
    println(alias[0])
}
```

其中 `Option模式` 大量应用了不定参数

## Defer

Golang 允许你从方法返回前一刻执行一段逻辑

Defer 的运行逻辑类似于栈即 `后进先出`  

```go
func Defer() {
    defer func() {
        println("第一个defer")
    }()
    defer func() {
        println("第二个defer")
    }()
}
```

输出如下
```
第二个 defer 
第一个 defer
```

![defer.png](defer.png)


### 问题

1. defer 有一个 catch 的机制，主要考 `for` 中的内容，如果是通过闭包传递或者是通过拷贝变量进行copy 他会catch到当前值而不是最后值

```go
func DeferClosureLoopV1() {
	println()
	for i := 0; i < 10; i++ {
		defer func() {
			print(i)
			print(" ")
		}()
	}
}

// 预计是 10,10,10,10 拿到的是最后一个

func DeferClosureLoopV2() {
	println()
	for i := 0; i < 10; i++ {
		defer func(val int) {
			print(val)
			print(" ")
		}(i)
	}
}

// 预计是 1,2,3... 10
// 实际是 9,8 ,7 ,6 ,5,4,3,2,1

func DeferClosureLoopV3() {
	println()
	for i := 0; i < 10; i++ {
		j := i
		defer func() {
			print(j)
			print(" ")
		}()
	}
}

// 预计是 10，10，10 ？
// 实际上是 9,8,7,6,5,4,3,2,1
```

## 基本数据结构

## 面试重点



## 最后

1. 了解函数式编程在在业务中的使用
2. 了解内存泄漏，业务上的内存泄漏，排查方法，解决办法
3. 了解垃圾回收的机制
4. 了解 Option 模式


写出一个 泛型工具支持

1. 切片的辅助方法 : 添加、删除、查找、求并集、交集、map reduce API
2. map 辅助方法
3. 扩展 map 实现 : 接受任意类型的 HashMap, TreeMap, LinkedMap
4. List 实现 : LinkedList, ArraryList 和 SkipList
5. Set: 包括 HashSet 和 TreeSet, SortedSet
6. 队列: 普通队列,优先队列
7. bean 操作操作辅助类 : 高性能高扩展的 bean copier机制
8. 并发扩展工具 : 包括并发队列,并发阻塞队列,并发阻塞优先队列
9. 协程池

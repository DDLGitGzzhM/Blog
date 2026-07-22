---
title: "面经每日一看"
description:  学累了我就看面经
date: 2026-07-22
slug: interview_0x02
categories:
    - interview
    - time-line
---

本篇面经来自 : https://www.nowcoder.com/feed/main/detail/ac0efc95550947c0a55693799dbfa380?sourceSSR=search

## 个人背景与项目挖掘

Q : 简单介绍一下目前在职的情况，以及寻找新机会（离职）的原因是什么？

Q : 介绍一下你在做的项目，核心思想和解决的痛点是什么？

两个很普通的问题 : [总结](https://ddlgitgzzhm.github.io/p/fire-workd-03/)

问题 2 : 预计到时候要准备一篇 500 字的演讲稿方便背诵 。 已添加到 Memo 中 ddl 预计下个月

## Go 语言基础

### 常识题

Q : 项目里用到了 Gin 框架，请问 Gin 第一层的参数绑定（Parameter Binding）底层是怎么实现的？

Gin 支持 `Bind` 和 `ShouldBind` 两种调用

```go
func (c *Context) ShouldBind(obj any) error {
	b := binding.Default(c.Request.Method, c.ContentType())
	return c.ShouldBindWith(obj, b)
}

func (c *Context) Bind(obj any) error {
	b := binding.Default(c.Request.Method, c.ContentType())
	return c.MustBindWith(obj, b)
}
```

其中通过 Method 来分发对应的实现

```go
func Default(method, contentType string) Binding {
	if method == http.MethodGet {
		return Form
	}
	switch contentType {
// ... 
		return BSON
	default: // case MIMEPOSTForm:
		return Form
	}
}
```

`shouldbind` 不额外封装 http-code，但是`bind`额外封装 。

```go
func (c *Context) ShouldBindWith(obj any, b binding.Binding) error {
	return b.Bind(c.Request, obj)
}

func (c *Context) MustBindWith(obj any, b binding.Binding) error {
	err := c.ShouldBindWith(obj, b)
	if err != nil {
		var maxBytesErr *http.MaxBytesError
// ... 
		switch {
		case errors.As(err, &maxBytesErr):
			c.AbortWithError(http.StatusRequestEntityTooLarge, err).SetType(ErrorTypeBind) //nolint: errcheck
		default:
			c.AbortWithError(http.StatusBadRequest, err).SetType(ErrorTypeBind) //nolint: errcheck
		}
		return err
	}
	return nil
}
```

具体更核心的实现，预计就是读取 `http` 的请求根据各种字段进行处理。预计只要回答到这一步即可

**todo** : 整理这部分内容单独到 `Gin` 中

---

Q : Go 语言中的 Channel 有什么特点？在使用它的时候需要注意什么？

吐槽一下 : 说实话实际工作中用到 channel 的地方真的很少

目前的印象来说 :

channel 的发送操作和接收操作 会相互阻塞直到双方准备完毕

使用它有什么需要注意的 ： 记得 close


**todo** : 这个后续预计会在系统整理 高并发那一块处理，或者是在补充《协程池》这篇文章后进行针对学习

---

Q : 如果一个 Channel 已经关闭了，再往里面写数据会发生什么情况？

WrongAnser : 从上面的回答来看，如果接收方的channel关闭，但是发送方的没关闭，预计是会一直阻塞，然后程序运行后会出错 `all sleep goroutine, deal lock` 印象中是这样

True : panic: send on closed channel 

**todo** : 会一并同上面的问题一起处理


### 代码输出题

```
有一个切片 s := make([]int, 3)，
然后往里追加数据 s = append(s, 1, 2, 3)，
最终 fmt.Println(s) 打印输出的结果是什么？
```

这个问题是默认补0吧，println不是sprintf(%v)感觉会输出地址？ 不过预计答案是 0,0,0,1,2,3

纠正 : fmt.Println 对 slice 用的就是类似 %v 的默认格式，打印的是元素内容：[0 0 0 1 2 3]

## Redis 

Q : Redis 的分布式锁怎么实现的 ?

不知道，印象中是 `setNx` 但是没实际实现过

**todo** : 补在memo中

---

Q : 如果现在想做一个排行榜功能，应该用 Redis 的哪种数据结构？

Zset, 不过如果要处理 `100w` 的排行的话 需要在业务上额外处理一下，例如定时排序+Zset 不过这个作业目前还没完成 只是知道一个概念

**todo** : 补在memo中

----

Q : Redis 的字符串类型中，有没有哪个指令能够对已存储的数字进行累加？

没看懂这个什么问题，字符串类型的累加？ IncrBy() 吗，需要注意的是 如果没有key和有key的情况。这个在 查询和缓存计数的时候有考，预计在下周总结出来


---

Q : 了解 Redis 的缓存雪崩、缓存穿透和缓存击穿吗？分别是什么以及怎么解决？

吐槽 : 梦会实习面经

缓存雪崩指的是 : 大量数据没有命中缓存 导致都打到数据库上

缓存穿透 : 指的是数据在缓存和数据库中都不存在

缓存击穿 : 热点 key 正好过期，此时又有大量数据引入

解决办法忘记的差不多了，不过从现在的业务理解上面看

1. 给数据库进行限流降级，保住一部分用户的使用。 另外使用其他可用的Redis
2. 都不存在，那就用 布隆过滤器过滤一下，本质上就是给不存在的key增加一个缓存
3. 和方法2差不多，也是缓存一下这个过期的 大V key

## Kafka

Q : Kafka 是怎么保证消息消费的有序性的？

没用过 Kafka 不知道

**todo** : 推进 kakfa 的学习

## SQL

```
假设有一个部门表 department，包含以下四列：ID（主键）、UID、age（年龄）、dept_id（部门 ID）。
需求：查询平均年龄在 20 岁以上的部门 ID。
```

吐槽 : 没想到 `26年`的面试也是这么存粹，还有手撕`sql`的环节

这里简单手撕一下，估计牛客上面有原题输入输出什么的预计，这周末去刷一下

```
select dept_id from ( 
    select dept_id,avg(age) as avg  from department where avg > 20 group by dept_id
)
```

猜测是这样

## 手撕代码

```
golang语言用协程交替打印1-100
```

这个炫技做法就是 参考我这里的实现吧[协程池](https://ddlgitgzzhm.github.io/p/gouroutine_pool_0x01/) ，用协程池开2个goroutine 输出就行了？不过输出的时候全局变量要上锁

感觉不用搞这么麻烦，直接手动开启两个 gouroutine ，然后用 `atomic`并发安全的基本类也行？

不过怎么实现交替，用管道通信？一个携程输出完 然后传给另外一个 直到 100 然后`close` ? 

写了一下没写出来，看着是 写入方和接收方 不能够同时操作 ... 

**todo:** 实现 1-100交替输出

```go
type printer struct {
	numerChan  chan atomic.Int64
	changeFlag atomic.Bool
}

func main() {
	wg := sync.WaitGroup{}
	wg.Add(3)

	p := printer{
		numerChan:  make(chan atomic.Int64),
		changeFlag: atomic.Bool{},
	}

	printNum := atomic.Int64{}
	go func() {
		p.numerChan <- printNum
	}()

	trueGoroutine := func(x atomic.Int64) {
		fmt.Println(x)
	}
	falseGoroutine := func(x atomic.Int64) {
		fmt.Println(x)
	}
	select {
	case printNum = <-p.numerChan:
		if printNum.Load() == 100 {
			defer close(p.numerChan)
			wg.Done()
			wg.Done()
			wg.Done()
		} else if p.changeFlag.Load() {
			go trueGoroutine(printNum)
			printNum.Add(1)
			p.numerChan <- printNum
		} else {
			go falseGoroutine(printNum)
			printNum.Add(1)
			p.numerChan <- printNum
		}
	}
	wg.Wait()
}
```

## AI Summary

### 总评

**答对：4 / 11**（另有 2 道半对）
**评分：48 / 100**

按技术题计（不含自我介绍/项目介绍）。能答对的多是「知道用什么」，卡在「怎么做对 / 边界 / 落地」。

### 逐题核对

| # | 题目 | 判定 | 说明 |
|---|------|------|------|
| 1 | Gin 参数绑定 | ✅ | Bind/ShouldBind、按 Method/ContentType 分发，方向对，面试够用 |
| 2 | Channel 特点与注意 | ⚠️ | 「互相阻塞」只覆盖无缓冲；「记得 close」不准确 |
| 3 | 往已关闭 channel 写 | ❌ | 你自己标了 Wrong；正确是 `panic: send on closed channel` |
| 4 | `make([]int,3)` + append | ✅ | `[0 0 0 1 2 3]` 正确 |
| 5 | Redis 分布式锁 | ❌ | 只想到 setNx，缺过期、value、续期、释放校验 |
| 6 | 排行榜用啥 | ✅ | ZSet 正确 |
| 7 | 字符串累加 | ✅ | INCR/INCRBY 正确 |
| 8 | 雪崩/穿透/击穿 | ⚠️ | 定义大致对，方案混、不完整 |
| 9 | Kafka 有序性 | ❌ | 空白 |
| 10 | SQL 平均年龄 | ❌ | 应用 `HAVING`，不能 `WHERE avg > 20` |
| 11 | 协程交替打印 | ❌ | 没写出；现有代码结构也不对 |

### 优点

1. **会追源码**：Gin 那题不是背概念，而是顺着 `ShouldBind` → `Default` → `MustBindWith`，面试里加分。
2. **知道错在哪**：closed channel、slice 打印都能自纠，学习闭环在。
3. **选型直觉还行**：排行榜 ZSet、计数 INCR，方向不偏。
4. **有复盘习惯**：todo / memo 落点清楚，比「看完就过」强。

### 缺点

1. **基础边界不熟**：channel close、SQL `HAVING`、手撕交替打印 —— 都是高频送分题。
2. **中间件偏「听过没用过」**：Redis 锁、Kafka 几乎空。
3. **缓存三兄弟**：定义能背一半，方案和场景对不上（击穿该用互斥/singleflight，不是「再缓存一下」）。
4. **手撕偏复杂**：交替打印绕 atomic + channel of atomic，反而写挂；面试要最小正确实现。

### 建议（按优先级）

**本周先补这 4 个，能直接拉到 ~65：**

1. **SQL**

   `SELECT dept_id FROM department GROUP BY dept_id HAVING AVG(age) > 20`

2. **Channel**

   无缓冲/有缓冲、close 后读零值、写 panic、nil channel 永久阻塞、谁负责 close

3. **交替打印**（双 channel 或一个 channel + 两个 goroutine 即可）

```go
func main() {
	ch1, ch2 := make(chan struct{}), make(chan struct{})
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		for i := 1; i <= 100; i += 2 {
			<-ch1
			fmt.Println("A:", i)
			ch2 <- struct{}{}
		}
	}()
	go func() {
		defer wg.Done()
		for i := 2; i <= 100; i += 2 {
			<-ch2
			fmt.Println("B:", i)
			if i < 100 {
				ch1 <- struct{}{}
			}
		}
	}()
	ch1 <- struct{}{}
	wg.Wait()
}
```

4. **Redis 锁一句话版**

   `SET key uuid NX EX 30` → 业务 → Lua 校验 uuid 再 DEL；进阶再提 Redlock / 看门狗续期。

**下周：** Kafka「单分区有序 + 同 key 进同分区」；缓存三兄弟各配 1 个标准方案（随机 TTL / 布隆或空值 / mutex）。

**面试表达：** Gin、ZSet 这类题用「结论 → 一句原理 → 一句坑」三段式，比贴大段源码更稳。

**一句话：** 选型感和复盘习惯不错，但基础题失分多；先把 SQL / Channel / 手撕 / Redis 锁补实，分数会比补 Kafka 涨得更快。

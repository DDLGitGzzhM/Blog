---
title: "channel"
description:  channel
date: 2026-07-27
slug: channel_0x01
categories:
    - golang
    - time-line
tags: [
  "gold",
]
---

## channel 语法

`var ch chan T`.  声明 channel 

`make(chan T)` 和 `make(chan T, size)` 声 不带容量 和 带容量的 `channel` 

`ch <- data` 发送消息到 `channel` 里面

`val := <- ch` 从 `channel` 里面读取数据

`close(ch)` 关闭 `channel`

### channel 的 close 问题

`close` 不是幂等的

当被 `close` 之后

1. 继续写入数据，会 panic

2. 从 channcel 读取的数据 会读到 0 值 。 val, ok := <- ch ; ok = 0 

3. 再次 close 会 panic

在实践中坚持一个原则 : 谁创建的 channel 谁来关, 可以避免很多 channel 没有正确关闭的问题 

## channel Loop 

我们可以使用 `for range` 进行读取 channel 的数据 

但是需要注意 `close` 如果不 `close channel` 会 panic .  因为接收方会一直接受数据，但是发送方没有数据了 所以会一直阻塞

```go
func LoopChannel() {
	ch := make(chan int)

	go func() {
		for i := 0; i < 3; i++ {
			ch <- i
			time.Sleep(time.Second)
		}
		close(ch)
	}()

	for val := range ch {
		fmt.Println(val)
	}
	fmt.Println("done")
}
```

## channel & 阻塞

- 如果接受者读不到数据，就会阻塞

- 如果发送者写不了消息，就会阻塞


### 有缓冲和 无缓冲的 channel 

无缓冲 Channel  :

- 容量: 大小为0，不能存储任何数据

- 同步性：是同步的。发送者发送数据时，必须有接收者准备好接收，否则发送方会一直阻塞；反之亦然。

- 作用：提供强同步保证，确保两个 goroutine 在某一时刻完成了数据交接

缓冲 Channel ：

- 容量：大小大于 0，可以存储指定数量的元素。

- 同步性：是异步的。只要缓冲区没满，发送数据就可以立刻返回而不阻塞；只要缓冲区不空，读取数据就可以立刻返回值。

- 作用：解耦生产者和消费者，能够平滑突发流量，提高程序的运行效率。


有缓冲的写法 :

```go
func BufferChannel() {
	ch := make(chan int, 3)
	defer func() {
		close(ch)
	}()
	for i := 1; i <= 3; i++ {
		ch <- i
	}

	for i := 1; i <= 3; i++ {
		val := <-ch
		fmt.Println(val)
	}
}
```

无缓冲的写法 : 

1. 要写进行接收，然后才可以进行发送

2. 并且必须同时处理

```go
func NoBufferChannel() {
	ch := make(chan int)
	defer func() {
		close(ch)
	}()
	for i := 1; i <= 3; i++ {
		go func() {
			val := <-ch
			fmt.Println(val)
		}()
		
		ch <- i
	}

	//for i := 1; i <= 3; i++ {// panic
	//	val := <-ch
	//	fmt.Println(val)
	//}
}
```


### channel 与 select 

`select-case` 用于控制从不同的 channel 中读写数据 ，只运行一次

语法

```go
select {
	case ch <- val: // 写入
	case val := <- ch2 // 读取
	default : 
}
```

1. 每一个 case 都可以是读取或者是写入数据到 channel

2. 没有 default 分支的时候, select 就会阻塞

3. 如果有多个分支同时满足 会随机执行一个

4.  case 后面不需要break 


## 应用

### 输出 0 - 100 

使用 goroutine, `交替` 输出 0 - 100 

写法如下 : 

```go
func Print100() {
	time := time2.Now()
	even := make(chan int)
	odd := make(chan int)
	wg := sync.WaitGroup{}
	wg.Add(2)

	go func() {
		for i := 0; i <= N; i += 2 {
			<-even
			fmt.Print("p1:", i, "\n")
			if i == N {
				wg.Done()
				close(odd)
				return
			}
			odd <- i
		}
	}()

	go func() {
		for i := 1; i <= N; i += 2 {
			<-odd
			fmt.Print("p2:", i, "\n")

			if i == N-1 {
				wg.Done()
				close(even)
				return
			}
			even <- i
		}
	}()

	even <- 0
	wg.Wait()
	fmt.Println("cost:", time2.Now().Sub(time))
}
```

我们也可以使用一个 channel 进行

```go
func print100() {
	time := time2.Now()
	ch := make(chan int)
	wg := sync.WaitGroup{}
	wg.Add(1)

	go func() {
		for {
			val, ok := <-ch
			if !ok {
				return
			}
			fmt.Print("p1:", val, "\n")
			if val == N {
				wg.Done()
				close(ch)
				return
			}
			val += 1
			ch <- val
		}
	}()

	go func() {
		for {
			val, ok := <-ch
			if !ok {
				return
			}
			fmt.Print("p2:", val, "\n")
			if val == N {
				wg.Done()
				close(ch)
				return
			}
			val += 1
			ch <- val
		}
	}()

	ch <- 0
	wg.Wait()
	fmt.Println("time:", time2.Now().Sub(time))
}
```



在 1e7 的数据下 : 

2 个协程 : cost: 9.692623833s

顺序遍历 : cost : 6.417589125s

#### 失败的写法

我这里使用使用 `for` 直接进行输出，但是这里没办法保证是 `交替` 输出

因为我们这里只是保证了能够存入 channel 而没办法 fmt.Print 

```go
func NewPrinter2() *Printer2 {
	p := &Printer2{
		ch: make(chan int),
	}
	return p
}

func (p *Printer2) Print() {
	for val := range p.ch {
		fmt.Println("p2:", val)
	}
}

func SelectChange100() {
	p1 := NewPrinter1()
	p2 := NewPrinter2()
	defer func() {
		close(p1.ch)
		close(p2.ch)
	}()

	go p1.Print()
	go p2.Print()

	for i := 1; i < 100; i++ {
		if i%2 == 1 {
			p1.ch <- i
		} else {
			p2.ch <- i
		}
	}
}
```

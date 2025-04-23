---
title: "[设计模式] SRP 单一职责原则"
description:  srp 单一职责原则 从入门到进阶 
date: 2025-04-24
slug: srp
image: luca-bravo-alS7ewQ41M8-unsplash.jpg
categories:
    - design-pattern
---

## 简要
对于一个温度显示系统，如果我们要显示不同的温度, 简单做法是直接写在一个 class 里面

````go
type tempV1 struct {
	temp float64
}

func (t *tempV1) ShowCelsius() string {
	return fmt.Sprintf("%.1f°C", t.temp)
}

func (t *tempV1) ShowFahrenheit() string {
	return fmt.Sprintf("%.1f°F", t.temp*9/5+32)
}

func (t *tempV1) ShowKelvin() string {
	return fmt.Sprintf("%.1fK", t.temp+273.15)
}
````

\
如果我们使用 SRP 的做法
````go
type tempV2 struct{
	temp float64
}

func (t *tempV2) GetTemp() float64 {
	return t.temp
}

type TempDisplayed struct{
}

func (d *TempDisplayed) Celsius(temp float64) string {
	return fmt.Sprintf("%.1f°C", temp)
}

func (d *TempDisplayed) Fahrenheit(temp float64) string {
	return fmt.Sprintf("%.1f°F", temp*9/5+32)
}

````

从实际业务开发的角度来看
1. 第一种方法更适合做快速开发，也就是前期的造轮子阶段
2. 第二种方法适合进行维护和新增以及复用功能

从微服务角度来看
1. 我们展示温度的功能应该单独的一个组件, 或者说是一个服务, 也就是我们如果新增了新的展示温度功能,我们不应该重启温度服务，只需要重启温度展示服务即可

从内存角度来看
1. 由于我们新增的 `TempDisplayed` 并没有实际的 VALUE,属于无状态的 CLASS ,  不占用额外内存。从 BenchMark 的结果来看，每次操作内存分配次数都是 4 allocs/op, 每次操作分配字节数都是  32B/op 和预期的一样
2. 即我们并没有花更多的内存代价,就实现了代码服务的隔离
````txt
pkg: GolangLearning/design-pattern
cpu: 12th Gen Intel(R) Core(TM) i5-12400
BenchmarkTempV1_Allocs-12        3861781               310.1 ns/op            32 B/op          4 allocs/op
BenchmarkTempV2_Allocs-12        3682756               290.2 ns/op            32 B/op          4 allocs/op
PASS
````

## 进阶
 todo 

## 参考
https://juejin.cn/post/6967279849597566984?searchId=2025042323171433459C03C38A4C01D6A7
https://juejin.cn/post/7385388449618493477?searchId=2025042323171433459C03C38A4C01D6A7
---
title: "搜索 detail"
description: 我们项目实现了一个 xxxx 
date: 2026-08-06
slug: select-0x01
categories:
    - golang
    - time-line
tags: [
  "gold",
  "webook-detail"
]
---

## 简历 preview

简历上 : 设计并实现了 搜索

### 需求分析

平台里面都会有一个搜索栏 大体上的目的是 : 

- 方便用户快速找到所需的内容

- 增加广告收入


支持搜索主要是支持 :

- 搜索具体的用户

- 搜索某篇文章

因为需要考虑使用使用 ES 进行实现, 所以需要把这两个服务原有的数据 额外的 写入到 ES 中 。 

![find_struct.png](find_struct.png)


---

Q : 为什么 不是用户直接写入到 ES 

A : 从 DDD 的角度来说 , es 并不考虑 user 的索引怎么确定 也不处理一些业务相关的内容 。 所以只能通过 search 服务

### 表结构设计

#### 文章表结构

mapping : 

title : type : text 

content : type : text 

id : type long ; (贯穿业务的id)

status : type : interger 


#### 用户表结构

mapping :

nickname : type : text

email : type : text (不使用keyword，正常人很难记住邮箱)

phone : type : keyword 

id : tyoe long 

- (这里要不要处理,理论上来说前端是不支持的 。 用户层面应该是看不到的，但是客服预计能看到)


## 面试

1. 你有没有用过 ES ？ 用它来解决什么问题？ 

2. ES 中的倒排索引是什么？ 为什么叫做倒排索引 ？ 

3. ES 是如何组织倒排索引的 ？ 核心是利用了 FST 结构

4. ES 的节点类型有哪些？ 他们的作用是什么 ？

5. ES 的写入过程是怎么样的 ？ 为什么说他是近实时的 
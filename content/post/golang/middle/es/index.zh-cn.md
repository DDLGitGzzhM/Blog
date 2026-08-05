---
title: "Es"
description: es
date: 2026-08-05
slug: es-0x01
categories:
    - golang
    - time-line
tags: [
  "gold",
]
---

## Es

提供一种简单、高效的方式 来存储、搜索和分析大量数据

ES 支持近实时的搜索

ES 支持极大数据量

ES 提供 Resful API


主要核心就是 : 搜索

搜索引擎的搜索并不依赖 ES，因为搜索引擎优先出现 。 但是他们底层都是 倒排索引

`搜索、广告、金融`


数据的组织方式 : 

- `索引`: 类比 Mysql 的表

- `文档` : 类比 Myssql 的表的数据

数据的部署方式 :

- `分片`: 类比关系数据库的分库分表

- `副本` : 类比主从同步中的从库

![es_index.png](es_index.png)

### 索引与倒排索引

索引 : 数据本身

倒排索引 : 从属性出发，找到这些属性的数据


![es_index_s.png](es_index_s.png)

### ES 写入流程 :

1. 文档首先写入到 `buffer` 里面

2. 定时刷新到 `page cache` 中 ，这个过程叫做 `refresh` 

3. 刷新到磁盘中

![es_write.png](es_write.png)
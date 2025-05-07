---
title: "[SQL] 基础查询"
description: 牛客网刷 sql day 1
date: 2025-04-24
slug: primary-select
image: sql.png
categories:
    - sql
---

## 查询所有列

两种做法,一种是 *, 另外一种是全量的显示所有的列。 本质上这两个没什么区别

从业务角度来看 
1. 如果当前的 sql 并不打算查新增的列 则可以使用第一种
2. 如果后续有列被删除了, 第二种也需要同步改动(当然生产环境很少有直接删除的)

从索引角度来看

1. 如果 剩下的字段建立了二级索引，那么第二种方法可以避免一次回表操作
2. 如果没有二级索引(二级缩影需要覆盖整个查询的列)这两个其实是一样的
````sql
SELECT * FROM user_profile
SELECT id,device_id,gender,age,university,province FROM user_profile;
````
[牛客网题目链接](https://www.nowcoder.com/practice/f9f82607cac44099a77154a80266234a?tpId=199&tqId=1971219&sourceUrl=%2Fexam%2Foj%3FquestionJobId%3D10%26subTabName%3Donline_coding_page)

## 查询结果去重

1. select distinct  只用于列的去重
2. select group by 可以用于一些聚合操作 如 count , avg
````sql
select distinct university from user_profile 
select unviersity from user_profile group by  unviersity
````

从性能上看
1. distinct 和 group by 没什么区别, 在只需要去重的场景 distinct 性能可能略好于 group by, 效率取决于 `DISTINCT`

从业务上看
1. 如果我们想要使用聚合函数, 如计算分组内的平均数 和 总数 那么必须使用 distinct

[牛客网题目链接](https://www.nowcoder.com/practice/82ebd89f12cf48efba0fecb392e193dd?tpId=199&tqId=1971234&sourceUrl=%2Fexam%2Foj%3FquestionJobId%3D10%26subTabName%3Donline_coding_page)


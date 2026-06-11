---
title: "[SQL] 高级操作符"
description: 牛客网刷 sql day 3
date: 2025-05-06
slug: senior-select-1
image: sql.png
categories:
    - sql
    - time-line
---
## 高级操作符练习 1
> 题目：现在运营想要找到male且GPA在3.5以上(不包括3.5)的用户进行调研，请你取出相关数据。

1. 业务场景中, 需要提前加上其他判断 `gpa is not null`

````sql
select device_id,gender,age,university,gpa from user_profile where gpa > 3.5 and gender = 'male'
```` 

[牛科练习题目](https://www.nowcoder.com/practice/2d2e37474197488fbdf8f9206f66651c?tpId=199&tqId=1971781&sourceUrl=%2Fexam%2Foj)

## 高级操作符练习 2 

> 题目：现在运营想要找到学校为北大或GPA在3.7以上(不包括3.7)的用户进行调研，请你取出相关数据（使用OR实现）
1. 就简单介绍了一下 or 怎么用
2. 顾名思义
````sql
select device_id, gender, age, university, gpa from user_profile where university = '北京大学' or gpa > 3.7
````
[牛科练习题目](https://www.nowcoder.com/practice/25bcf6924eff417d90c8988f55675122?tpId=199&tqId=1971821&sourceUrl=%2Fexam%2Foj)

## Where in 和 Not in
> 题目：现在运营想要找到学校为北大、复旦和山大的同学进行调研，请你取出相关数据。

1. 顾名思义
2. todo 性能分析 @我

````sql
select device_id, gender,age,university,gpa from user_profile where university in ('北京大学', '复旦大学', '山东大学')
````
[牛科练习题目](https://www.nowcoder.com/practice/0355033fc2244cdaa09b2bd6e794c762?tpId=199&tqId=1975665&sourceUrl=%2Fexam%2Foj)

## 操作符混合运用 

> 题目：现在运营想要找到gpa在3.5以上(不包括3.5)的山东大学用户 或 gpa在3.8以上(不包括3.8)的复旦大学同学进行用户调研，请你取出相应数据,取出的数据按照device_id升序排列

````sql
select device_id, gender,age, university,gpa 
from user_profile
where 
 ( gpa > 3.5 and university = '山东大学' )
 or 
  (gpa > 3.8 and university = '复旦大学')
order by device_id asc
````

1. 这里可以改为子查询的方式，时间或许会更短
````sql
select device_id, gender, age, university, gpa from user_profile 
where
device_id in 
(select device_id from user_profile where gpa>3.5 and university='山东大学')
or
device_id in 
(select device_id from user_profile where gpa>3.8 and university='复旦大学') 
````
[牛客网题目](https://www.nowcoder.com/practice/d5ac4c878b63477fa5e5dfcb427d9102?tpId=199&tqId=1975666&sourceUrl=%2Fexam%2Foj)

### 查看学校名称中含北京的用户

> 题目：现在运营想查看所有大学中带有"北京"的用户的信息(device_id,age,university)，请你取出相应数据。
1. 字符匹配
2. 四种通配符
3. `%` 匹配 0 个 或者是 多个字符
4. `_` 匹配任意一个字符 `_李`
5. `[]`匹配`[]`中任意一个字符,如果比较的字符串是连续的，可以用`-`表达
6. `[^]`不匹配`[]`中任意一个字符
````sql
select device_id, age, university from user_profile where university like '%北京%'
````
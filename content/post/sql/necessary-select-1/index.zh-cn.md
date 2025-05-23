---
title: "[SQL] 必要函数"
description: 牛客网刷 sql day 4
date: 2025-05-08
slug: necessary-select-1
image: sql.png
categories:
    - sql
---

## 条件函数
### 计算25岁以上和以下的用户数量

以下是修复后的Markdown内容，保持引用格式并优化表格展示：

> 题目：现在运营想要将用户划分为25岁以下和25岁及以上两个年龄段，分别查看这两个年龄段用户数量  
> **本题注意**：age为null 也记为 25岁以下
>
> 示例：user_profile
>
> | id | device_id | gender | age | university | gpa | active_days_within_30 | question_cnt | answer_cnt |  
> |----|-----------|--------|-----|------------|-----|-----------------------|--------------|------------|  
> | 1  | 2138      | male   | 21  | 北京大学   | 3.4 | 7                     | 2            | 12         |  
>
> 根据题目要求，你的查询应返回以下结果（注意age为null的情况应归类为25岁以下）：
>
> | age_cut    | number |  
> |------------|-------|  
> | 25岁以下   | 4     |  
> | 25岁及以上 | 3     |  


新知识点 

> Q : 这个 age_cut , 25岁以下 ，25岁以上 是怎么插进去的

A : 原来 我们 SELECT CONST STRING, 那么就会输出对应的 STRING

> Q : 怎么进行判断 25 岁以下, 25岁以上

A : 
1. 第一种方法， 使用 `CASE (WHEN ... ELSE) END` 的形式
2. 第二种方法， 使用 `IF(JUDGE , TRUE, FALSE)`  很明显 这种语句只支持两个结果

所以对于本体 我们的做法 是 `SIWTCH ( CONST STRING ) FROM TABLE` 的形式

````sql
SELECT 
    (
        CASE 
           WHEN age < 25 THEN '25岁以下'
           WHEN age >= 25 THEN '25岁及以上'
           ELSE '25岁以下'
        END
    ) as age_cut, count(*) as number
from user_profile
group by age_cut
````

````sql
select 
    (case
        when age>=25 then '25岁及以上'
        else '25岁以下' end) as age_cut, 
    count(*) as number
from user_profile
group by age_cut
````

**坑点 :** 
1. 由于这里使用了 `COUNT()` 这个聚合函数，所以必须加上 `GROUP BY`
2. 当我们涉及查询 既有聚合函数 `COUNT,SUM,AVG,MAX,MIN` , 又有普通列的时候，就必须用 `GRUOP BY`
3. 分组后, 如果我们想要对结果进行筛选必须使用`HAVING` ,`WHERE` 是分组前筛选, `HAVING` 是分组后筛选

[题目链接](https://www.nowcoder.com/practice/30f9f470390a4a8a8dd3b8e1f8c7a9fa?tpId=199&tqId=1975678&sourceUrl=%2Fexam%2Foj)

[送分题](https://www.nowcoder.com/practice/ae44b2b78525417b8b2fc2075b557592?tpId=199&tqId=1975679&sourceUrl=%2Fexam%2Foj)

## 日期函数
### 计算用户8月每天的练题数量
以下是修复后的Markdown内容，保持引用格式并优化表格展示：

> 题目：现在运营想要计算出2021年8月每天用户练习题目的数量，请取出相应数据
>
> 示例：question_practice_detail
>
> | id | device_id | question_id | result | date       |  
> |----|-----------|-------------|--------|------------|  
> | 1  | 2138      | 111         | wrong  | 2021-05-03 |  
>
> 根据题目要求，你的查询应返回以下结果（按日期升序排列）：
>
> | day        | question_cnt |  
> |------------|--------------|  
> | 13| 5            |  
> | 14 | 2            |

新知识点

> Q : 如何获取 日期 day , month , year 的信息

1. sql 支持使用 `year(), month(), day()` 的形式获取对应的 年月日 
2. `WEEKDAY()` 返回星期索引 , 0 = 星期一 ... 
3. `QUATER()` 返回季度 , 范围`1-4`
4. `MINUTE() , SECOND()`

````sql
#获取当前系统的日期时间
SELECT NOW(); # 2021-12-22 13:50:58

#获取当前系统的日期
SELECT CURDATE(); # 2021-12-22

#获取当前系统的时间
SELECT CURTIME(); # 13:53:11
````

````sql
#日期增加,使用函数date_add(date,INTERVAL exp type)
#增加1天
SELECT DATE_ADD('2021-12-22 13:50:58', INTERVAL 1 DAY);  # 2021-12-23 13:50:58
#增加1小时
SELECT DATE_ADD('2021-12-22 13:50:58', INTERVAL 1 HOUR);  # 2021-12-23 14:50:58

#日期减少，使用函数date_sub(date,INTERVAL exp type)
# 减少1天
SELECT DATE_SUB('2021-12-01 13:50:58', INTERVAL 1 DAY); # 2021-11-30 13:50:58

#其他间隔
INTERVAL 1 YEAR
INTERVAL 1 MONTH
INTERVAL 1 DAY
INTERVAL 1 HOUR
INTERVAL 1 MINUTE
INTERVAL 1 SECOND
````

思路
1. 这题 在知道如何操作日期之后就很简单了

````sql
SELECT DAY(date) as day , count(*) as question_cnt
from question_practice_detail
WHERE YEAR(date) = 2021 and MONTH(date) = 8
group by day
````

### 计算用户的平均次日留存率

以下是修复后的Markdown内容，保持引用格式并优化表格展示：

> 题目：现在运营想要查看用户在某天刷题后第二天还会再来刷题的留存率。请你取出相应数据
>
> 示例：question_practice_detail
>
> | id | device_id | question_id | result | date       |  
> |----|-----------|-------------|--------|------------|  
> | 1  | 2138      | 111         | wrong  | 2021-05-03 |  
>
> 根据示例，你的查询应返回以下结果（保留4位小数）：
>
> | avg_ret |  
> |---------|  
> | 0.3000  |  

题目要求 :
1. 计算 用户连续两天 都做题的占比
2. 注意一个用户一天可以做多个题

思路 :
1. 首先我们需要知道 如何比较 `有一条数据 是 另外一条数据的 第二天`
   2. 我们可以使用上面学到的 `DATE_ADD(DATE , INTERVAL X Y)` 比较 如果 `P1.DATE = DATE_ADD()` 的话那么就说明相差一天
   3. 因此我们肯定是 `DAY 1 TABLE JOIN DAY 2 TABLE`
   4. 由于我们需要知道 `DAY 1` 的总数，所以我们需要 `LEFT JOIN`

````sql
SELECT 
    ROUND(
        SUM( IF(p2.device_id IS NOT NULL ,1,0)) / COUNT(*) ,4
    ) as avg_ret
FROM  
(SELECT DISTINCT device_id, date from question_practice_detail) as p1
LEFT JOIN
(SELECT DISTINCT device_id, date from question_practice_detail) as p2 
ON 
p1.device_id = p2.device_id
and p2.date = DATE_ADD(p1.date, INTERVAL 1 day)
````

[牛客题目链接](https://www.nowcoder.com/practice/126083961ae0415fbde061d7ebbde453?tpId=199&tqId=1975681&sourceUrl=%2Fexam%2Foj)
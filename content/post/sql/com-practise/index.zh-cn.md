---
title: "[SQL] 综合练习 1"
description: 牛客网刷 sql day 6
date: 2025-05-25
slug: com-practise-1
image: title.png
categories:
    - sql
---

## 练习

### 统计复旦用户8月练题情况

> 题目：现在运营想要了解复旦大学的每个用户在8月份练习的总题目数和回答正确的题目数情况，请取出相应明细数据，对于在8月份没有练习过的用户，答题数结果返回0。
>
> **表结构**：
>
> 1. 用户信息表 `user_profile`
>
> | id | device_id | gender | age | university | gpa | active_days_within_30 |
> |----|-----------|--------|-----|------------|-----|-----------------------|
> | 1  | 2138      | male   | 21  | 北京大学   | 3.4 | 7                     |
> | 2  | 3214      | male   | 20  | 复旦大学   | 3.2 | 15                    |
>
> 2. 练习明细表 `question_practice_detail`
>
> | id | device_id | question_id | result | date       |
> |----|-----------|-------------|--------|------------|
> | 1  | 2138      | 111         | wrong  | 2021-05-03 |
> | 2  | 3214      | 112         | wrong  | 2021-08-01 |
> | 3  | 3214      | 113         | right  | 2021-08-15 |
> | 4  | 3214      | 114         | wrong  | 2021-08-20 |
>

> **输出示例**：
>
> | device_id | university | question_cnt | right_question_cnt |
> |-----------|------------|--------------|---------------------|
> | 3214      | 复旦大学   | 3            | 1                   |
> | 5432      | 复旦大学   | 0            | 0                   |

**题目要求解析 : **

1. 需要 `用户, 做题数量, 最对数量` 的一张子表 `cout(), sum(), group by device_id`
2. 需要 `用户, university` 的一张子表 `where university = ` 
3. 我们结果集是 `2` 表, `left join` 上 `1` 表. 对于 `NULL` 的情况
   4. 我们需要使用 `COALESCE()` 处理一下
5. 其他考点, `日期函数 month()`

````sql
select
    b.device_id, b.university,   
    COALESCE(temp.question_cnt, 0) AS question_cnt,
    COALESCE(temp.right_question_cnt, 0) AS right_question_cnt
from 
(
    select device_id, university 
    from user_profile as u 
    where u.university = '复旦大学'
) as b 
left join 
( 
    select device_id, count(question_id) as question_cnt, SUM(CASE WHEN result = 'right' THEN 1 ELSE 0 END) AS right_question_cnt
    from question_practice_detail
    where month(date) = 8
    group by device_id
) as temp 
on b.device_id = temp.device_id
````

另外一个做法, 聚合之后在做 聚合函数的计算 
````sql
SELECT 
    u.device_id,
    u.university,
    COUNT(qpd.question_id) AS question_cnt,
    SUM(CASE WHEN qpd.result = 'right' THEN 1 ELSE 0 END) AS right_question_cnt
FROM 
    user_profile u
LEFT JOIN 
    question_practice_detail qpd ON u.device_id = qpd.device_id
    AND qpd.date BETWEEN '2021-08-01' AND '2021-08-31'
WHERE 
    u.university = '复旦大学'
GROUP BY 
    u.device_id, u.university
ORDER BY 
    u.device_id;
````

[牛客题目链接](https://www.nowcoder.com/practice/53235096538a456b9220fce120c062b3?tpId=199&tqId=1980673&sourceUrl=%2Fexam%2Foj)

### 浙大不同难度题目的正确率

> 题目：现在运营想要了解浙江大学的用户在不同难度题目下答题的正确率情况，请取出相应数据，并按照准确率升序输出。
>
> **表结构**：
>
> 1. 用户信息表 `user_profile`
>
> | id | device_id | gender | age | university | gpa | active_days_within_30 | question_cnt | answer_cnt |
> |----|-----------|--------|-----|------------|-----|-----------------------|--------------|------------|
> | 1  | 2138      | male   | 21  | 北京大学   | 3.4 | 7                     | 2            | 12         |
> | 2  | 3214      | male   | 20  | 浙江大学   | 3.8 | 15                    | 5            | 25         |
>
> 2. 练习明细表 `question_practice_detail`
>
> | id | device_id | question_id | result  |
> |----|-----------|-------------|---------|
> | 1  | 3214      | 111         | wrong   |
> | 2  | 3214      | 112         | right   |
> | 3  | 3214      | 113         | right   |
> | 4  | 2138      | 114         | wrong   |
>
> 3. 题目难度表 `question_detail`
>
> | question_id | difficult_level |
> |-------------|-----------------|
> | 111         | hard            |
> | 112         | easy            |
> | 113         | medium          |
> | 114         | easy            |
>
> **输出要求**：
> - 只统计浙江大学用户
> - 计算不同难度题目的正确率（正确答题数/总答题数）
> - 正确率保留4位小数
> - 按correct_rate升序排列
>
> **输出示例**：
>
> | difficult_level | correct_rate |
> |-----------------|--------------|
> | hard            | 0.0000       |
> | easy            | 0.5000       |
> | medium          | 1.0000       |

**题目要求解析 :** 
1. 首先需要一张表 `浙江大学表 device_id, university`
2. 然后还需要一张表 `用户做题难度表, device_id, question_id, diffcult_level`
3. 所以我们先聚合上面`1`的 TABLE, 然后再 JOIN `2` 的 TABLE 
4. 最后计算答案
5. 这里有一个偷鸡的办法, 由于 `LEFT JOIN` 聚合出了 `NULL` 的列, 最后分组操作的时候, 使用 `having` 过滤了一下

````sql
select 
  qd.difficult_level as difficult_level,
  round(sum(if( temp.result = 'right', 1, 0)) / count(temp.result),4)as correct_rate
from (
 select qpd.device_id , qpd.question_id, qpd.result from user_profile as u  
 left join  question_practice_detail as qpd 
 on qpd.device_id = u.device_id and u.university = '浙江大学'
) as temp
left join  
question_detail as qd 
on temp.question_id = qd.question_id 
group by qd.difficult_level
having difficult_level is not null 
order by correct_rate asc 
````

其他解法 :

````sql
SELECT 
    qd.difficult_level,
    ROUND(
        SUM(CASE WHEN qpd.result = 'right' THEN 1 ELSE 0 END) * 1.0 / 
        COUNT(qpd.question_id),
        4
    ) AS correct_rate
FROM 
    user_profile u
JOIN 
    question_practice_detail qpd ON u.device_id = qpd.device_id
JOIN 
    question_detail qd ON qpd.question_id = qd.question_id
WHERE 
    u.university = '浙江大学'
GROUP BY 
    qd.difficult_level
ORDER BY 
    correct_rate ASC;
````
[牛客题目链接](https://www.nowcoder.com/practice/d8a4f7b1ded04948b5435a45f03ead8c?tpId=199&tqId=1980674&sourceUrl=%2Fexam%2Foj)

###  21年8月份练题总数

1. 送分题 不做解释 
````sql
select count(distinct device_id) as did_cnt , count(question_id) as question_cnt 
from question_practice_detail
where year(date) = 2021 and  month(date) = 8
````
[牛客题目链接](https://www.nowcoder.com/practice/b8f30b239b454ed490367b53ea95607d?tpId=199&tqId=2002640&sourceUrl=%2Fexam%2Foj)
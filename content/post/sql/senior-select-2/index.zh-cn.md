---
title: "[SQL] 高级查询"
description: 牛客网刷 sql day 3
date: 2025-05-06
slug: senior-select-2
image: sql.png
categories:
    - sql
---
# 计算函数
##  查找GPA最高值

> 题目：运营想要知道复旦大学学生gpa最高值是多少，请你取出相应数据

1. 关键点 `max` 
2. 四舍五入函数 `round(value, pos)` 
````sql
select max(gpa) as gpa from user_profile where university = '复旦大学' limit 1;

select round(max(gpa), 1) from user_profile where university='复旦大学';

SELECT gpa FROM user_profile
WHERE university = '复旦大学'
ORDER BY gpa DESC
LIMIT 1
````

## 计算男生人数以及平均GPA

> 题目：现在运营想要看一下男性用户有多少人以及他们的平均gpa是多少，用以辅助设计相关活动，请你取出相应数据。
1. 这里可以使用 `count(*)` 代替 `count(gender)`

````sql
select count(gender) as male_num ,avg(gpa) as avg_gpa  from user_profile where gender = 'male' 
````
# 分组函数 
## 分组计算练习题
> 题目：现在运营想要对每个学校不同性别的用户活跃情况和发帖数量进行分析，请分别计算出每个学校每种性别的用户数、30天内平均活跃天数和平均发帖数量。
>
>用户信息表：user_profile
>
>30天内活跃天数字段（active_days_within_30）
>
>发帖数量字段（question_cnt）
>
>回答数量字段（answer_cnt）

1. 没什么好说的, `group by` 多列的时候, 使用 `,` 进行区分
````sql
select 
       gender,university,
       count(university) as user_num, 
       avg(active_days_within_30) as avg_active_day,
       avg(question_cnt) as avg_question_cnt
from user_profile
group by gender, university order by gender asc, university asc
````

## 分组过滤练习题

> 题目：现在运营想查看每个学校用户的平均发贴和回帖情况，寻找低活跃度学校进行重点运营，请取出平均发贴数低于5的学校或平均回帖数小于20的学校。

1. 当使用聚合函数 作为塞选条件的时候，需要使用 `where` 代替 `having`
````sql
SELECT
    university,
    avg_question_cnt,
    avg_answer_cnt
FROM
    (
        SELECT
            university,
            AVG(question_cnt) AS avg_question_cnt,
            AVG(answer_cnt) AS avg_answer_cnt
        FROM
            user_profile
        GROUP BY
            university
    ) AS temp
WHERE
    avg_question_cnt < 5
    OR avg_answer_cnt < 20;
````

正解应该是  :
````sql
select
    university,
    round(avg(question_cnt),3) AS avg_question_cnt,
    round(AVG(answer_cnt),3) as avg_answer_cnt
FROM
    user_profile
GROUP BY
    university

HAVING
    avg_question_cnt<5  or
    avg_answer_cnt<20
````

## 分组排序练习题

> 现在运营想要查看不同大学的用户平均发帖情况，并期望结果按照平均发帖情况进行升序排列，请你取出相应数据
1. 这里和 `where`不同，竟然不需要子查询和更换其他 关键字。 聚合函数可以直接进行排序
````sql
select university, avg_question_cnt
from (
    select university, avg(question_cnt) as avg_question_cnt
    from user_profile
    group by university 
) as temp 
order by avg_question_cnt
````

正解 :
````sql
SELECT 
    university, 
    ROUND(AVG(question_cnt), 4) AS avg_question_cnt
FROM 
    user_profile
GROUP BY 
    university
ORDER BY 
    avg_question_cnt;
````
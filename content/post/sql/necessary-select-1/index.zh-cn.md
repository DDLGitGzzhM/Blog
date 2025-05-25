---
title: "[SQL] 必要函数 2"
description: 牛客网刷 sql day 5
date: 2025-05-23
slug: necessary-select-2
image: title.png
categories:
    - sql
---

## 文本函数
### 统计每种性别的人数
> 题目：现在运营举办了一场比赛，收到了一些参赛申请，表数据记录形式如下所示，现在运营想要统计每个性别的用户分别有多少参赛者，请取出相应结果
>
> 示例：user_submit
>
> | device_id | profile           | blog_url               |  
> |-----------|-------------------|------------------------|  
> | 2138      | 180cm,75kg,27,male | http:/url/bigboy777    |  
>
> 根据示例，你的查询应返回以下结果：
>
> | gender | number |  
> |--------|--------|  
> | male   | 2      |  
> | female | 1      |  

新知识点

> Q : 如何拆分 一个列里面的数据, 然后进行分组

A : `SUBSTRING_INDEX(profile, ',', -1) AS gender`
   1. `profile` 需要处理的字符串字段
   2. `,` 分隔符
   3. `-1` 从字符串右侧开始截取, 第一个出现的分隔符后面的 **所有内容**
![img.png](img.png)
````sql
select 
    SUBSTRING_INDEX(profile,',',-1) AS gender,
    COUNT(*) as number 
from 
    user_submit
group by
    gender 
````

其他方法 :
注意famale 和 male 有重合的地方，所以不能直接like male，否则female 也会被统计进 ‘male’
````sql
SELECT 
CASE 
WHEN profile LIKE '%,male' then 'male'
WHEN profile LIKE '%,female' then 'female'
else '其他'
end as gender,
COUNT(*) AS number 
FROM user_submit
GROUP BY gender;

SELECT IF(profile LIKE '%female','female','male') gender,COUNT(*) number
FROM user_submit
GROUP BY gender;
````
[题目链接](https://www.nowcoder.com/practice/f04189f92f8d4f6fa0f383d413af7cb8?tpId=199&tqId=1975682&sourceUrl=%2Fexam%2Foj)

[送分题](https://www.nowcoder.com/practice/26c8715f32e24d918f15db69518f3ad8?tpId=199&tqId=1975683&sourceUrl=%2Fexam%2Foj)

````sql
select 
device_id, 
SUBSTRING_INDEX(blog_url, '/',-1) as user_name 
from 
user_submit
````

### 截取年龄
> 题目：现在运营举办了一场比赛，收到了一些参赛申请，表数据记录形式如下所示，现在运营想要统计每个年龄的用户分别有多少参赛者，请取出相应结果
>
> 示例：user_submit
>
> | device_id | profile           | blog_url            |  
> |-----------|-------------------|---------------------|  
> | 2138      | 180cm,75kg,27,male | http:/ur/bigboy777 |  
>
> 根据示例，你的查询应返回以下结果：
>
> | age | number |  
> |-----|--------|  
> | 27  | 1      |  
> | 25  | 1      |  
> | ... | ...    |  

1. 两段 substring_index 

````sql
select 
SUBSTRING_INDEX( SUBSTRING_INDEX(profile, ',', -2),',', 1) as age ,
count(*) as number 
from user_submit 
group by age
````

## 窗口函数
### 找出每个学校GPA最低的同学

> 题目：现在运营想要找到每个学校gpa最低的同学来做调研，请你取出每个学校的最低gpa。
>
> 示例：user_profile
>
> | id | device_id | gender | age | university | gpa | active_days_within_30 | question_cnt | answer_cnt |  
> |----|-----------|--------|-----|------------|-----|-----------------------|--------------|------------|  
> | 1  | 2138      | male   | 21  | 北京大学   | 3.4 | 7                     | 2            | 12         |  
> | 2  | 3214      | male   | NULL| 复旦大学   | 4.0 | 15                    | 5            | 25         |  
>
> 根据示例，你的查询结果应参考以下格式，输出结果按university升序排序：
>
> | device_id | university | gpa |  
> |-----------|------------|-----|  
> | 6543      | 北京大学   | 3.2 |  
> | [id]      | [学校名]   | [最低gpa] |  

> Q : 题目要求求出一个 TopN 的问题 

A : 新知识点
````sql
<窗口函数> over (partition by <用于分组的列名>
                order by <用于排序的列名>)
````

窗口函数 `rank()`, `dense_rank`, `row_number`

`rank()` : 如果存在多个并列名次会占用, 即 `1,1,1,4`

`dense_rank()` : 如果存在多个并列名次不会占用, 即 `1,1,1,2`

`row_number()` : 不占用,不并列. 即 `1,2,3,4`

具体说明 :

[窗口函数知乎链接](https://zhuanlan.zhihu.com/p/92654574)

````sql
select device_id, university, gpa 
from (
    select device_id, university, gpa , RANK()  over (PARTITION BY university order by gpa) rk  from user_profile 
) a 
where a.rk = 1
````

另外由于这个只是一个 max-min 的问题, 我们同样可以是用 `JOIN` or `子表查询` 的方法做
````sql
select
    u.device_id , u.university, u.gpa
from 
    user_profile as u 
inner join 
(
    select min(gpa) as gpa, university
    from user_profile
    group by university  
) as temp
on temp.university = u.university and u.gpa = temp.gpa 
order by university

SELECT device_id, university, gpa
FROM user_profile u1
WHERE gpa = (
    SELECT MIN(gpa)
    FROM user_profile u2
    WHERE u2.university = u1.university
);
````
[牛客题目链接](https://www.nowcoder.com/practice/90778f5ab7d64d35a40dc1095ff79065?tpId=199&tqId=1980672&sourceUrl=%2Fexam%2Foj)

### 计算每日累计利润

> 题目：在一张`daily_profits`表中，存储了公司每天的利润记录。请计算每一种产品每一天的累计利润，并按`profit_date`升序输出所有字段。
>
> **具体要求**：
> 1. 计算每一天的累计利润
> 2. 输出结果按`profit_date`升序排列
>
> **表结构**：`daily_profits`
>
> | profit_id | profit_date | profit |
> |-----------|-------------|--------|
> | 1         | 2024-01-01  | 100.00 |
> | 2         | 2024-01-02  | 150.00 |
> | 3         | 2024-01-03  | 200.00 |
>
> **输出示例**：
>
> | profit_id | profit_date | profit | cumulative_profit |
> |-----------|-------------|--------|-------------------|
> | 1         | 2024-01-01  | 100.00 | 100.00            |
> | 2         | 2024-01-02  | 150.00 | 250.00            |
> | 3         | 2024-01-03  | 200.00 | 450.00            |

> Q : 我们需要逐天的累加每个分组的结果

A : 我们可以把整个结果集，看成一个分组。想要实现逐行累加，那么就需要使用 `窗口函数` , 但是我们不需要 `PARTITION BY` 进行分组

````sql
select * , sum(profit) over (order by profit_date) cumulative_profit 
from daily_profits
````

[牛客题目链接](https://www.nowcoder.com/practice/c9b7a2f73eb54a3da4a81f15fd8a3665?tpId=199&tqId=11212642&sourceUrl=%2Fexam%2Foj)

## 基础数学函数
###  基本数学函数
> 题目：在一张 `numbers` 表中，存储了一些数值。请使用 SQL 的基本数学函数，计算每个数值的绝对值、向上取整、向下取整、四舍五入到一位小数，并输出这些计算结果。
>
> **具体要求**：
> 1. 计算每个数值的绝对值
> 2. 计算每个数值的向上取整值
> 3. 计算每个数值的向下取整值
> 4. 计算每个数值四舍五入到一位小数
> 5. 输出结果按 `id` 升序排列
>
> **表结构**：`numbers`
>
> | id | value |
> |----|-------|
> | 1  | 3.14  |
> | 2  | -2.71 |
>
> **输出示例**：
>
> | id | value | absolute_value | ceiling_value | floor_value | rounded_value |
> |----|-------|----------------|---------------|-------------|---------------|
> | 1  | 3.14  | 3.14           | 4             | 3           | 3.1           |
> | 2  | -2.71 | 2.71           | -2            | -3          | -2.7          |

**新知识点 :**
1. `ABS()`, `ceil()`, `floor()`, `round()` 
2. 绝对值，向上取整，向下取整，精度

````sql
select *,
    abs(value) as absolute_value,
    ceil(value) as ceiling_value, #向上取整
    floor(value) as floor_value, #向下取整
    round(value,1) as rounded_value
from numbers
order by id ASC
````

[牛客网题目链接](https://www.nowcoder.com/practice/b139029a438b42488f784cf5cef98e2d?tpId=199&tqId=11212714&sourceUrl=%2Fexam%2Foj)
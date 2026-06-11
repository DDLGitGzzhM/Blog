---
title: "[SQL] 多表查询"
description: 牛客网刷 sql day 3
date: 2025-05-07
slug: multi-select
image: sql.png
categories:
    - sql
    - time-line
---
## 子查询
### 浙江大学用户题目回答情况
> 题目：现在运营想要查看所有来自浙江大学的用户题目回答明细情况，请你取出相应数据
>
> 示例：question_practice_detail
>
> | id | device_id | question_id | result |  
> |----|-----------|-------------|--------|  
> | 1  | 2138      | 111         | wrong  |  
>
> 第一行表示：id为1的用户的常用信息为使用的设备id为2138，在question_id为111的题目上，回答错误
>
> 示例：user_profile
>
> | id | device_id | gender | age | university | gpa | active_days_within_30 | question_cnt | answer_cnt |  
> |----|-----------|--------|-----|------------|-----|-----------------------|--------------|------------|  
> | 1  | 2138      | male   | 21  | 北京大学   | 3.4 | 7                     | 2            | 12         |  
>
> 第一行表示：id为1的用户的常用信息为使用的设备id为2138，性别为男，年龄21岁，北京大学，gpa为3.4，在过去的30天里面活跃了7天，发帖数量为2，回答数量为12
>
> 根据示例，你的查询应返回以下结果，查询结果根据question_id升序排序：
>
> | device_id | question_id | result |  
> |-----------|-------------|--------|  
> | 2315      | 115         | right  |


1. 两个表 根据 `device_id` 关联, 题目需要我们聚合 `qpd` 表的 `question_id` 和 `result` 字段 条件是 `up` 表的 `university` 是 `浙江大学`
2. 第一时间没有想到 `子查询` , 直接使用 `JOIN ON`了

````sql
select 
qpd.device_id,qpd.question_id,qpd.result
from 
user_profile as up
join 
question_practice_detail as qpd on up.device_id = qpd.device_id
where up.university = '浙江大学'
order by qpd.question_id
````

子查询代码如下
````sql
select device_id, question_id, result
from question_practice_detail
where question_practice_detail.device_id in (
    select device_id from user_profile
    where university = '浙江大学'
)
````

[牛客题目链接](https://www.nowcoder.com/practice/55f3d94c3f4d47b69833b335867c06c1?tpId=199&tqId=1975673&sourceUrl=%2Fexam%2Foj)

## 链接查询
### 统计每个学校的答过题的用户的平均答题数

> 题目：查找每个学校用户的平均答题数目（某学校用户平均答题数量计算方式为该学校用户答题总次数除以答过题的不同用户个数）

> 表结构说明：
>
> **user_profile** 用户信息表：
> - device_id：终端编号（每个用户有唯一的一个终端）
> - gender：性别
> - age：年龄
> - university：用户所在的学校
> - gpa：该用户平均学分绩点
> - active_days_within_30：30天内的活跃天数
>
> **question_practice_detail** 答题情况明细表：
> - question_id：题目编号
> - result：答题结果
>
> 示例数据：
>
> user_profile：
> 
> | device_id | gender | age | university | gpa | active_days_within_30 |
> |-----------|--------|-----|------------|-----|-----------------------|
> | 2138      | male   | 21  | 北京大学   | 3.4 |  7                      |
>
> question_practice_detail：
> 
> | device_id | question_id | result |
> |-----------|-------------|--------|
> | 2138      | 111         | wrong  |
>
> 要求：计算每个学校用户的平均答题数目（答题总次数/答过题的不同用户数），结果保留4位小数，按university升序排序
>
> 预期输出示例：
> 
> | university | avg_answer_cnt |
> |------------|----------------|
> | 北京大学   | 1.0000         |

题目要求
1.  根据 `up` 表的 `university` 聚合出 `qpd` 表中 每所大学的 平均答题数, 即 `university` 对应有的 `device_id` 总共有多少个记录在 `qpd` 表中
2.  这里有一个逻辑坑点 , `distinct up.device_id` 一开始认为 `device_id` 必然是唯一的 。但是我们 `join on` 之后，由于 `qpd`表的 `device_id` 是有多个的，所以我们最后用于计算的分母需要`DISTINCT`
````sql
select 
up.university,
round( count(qd.question_id)/count(distinct up.device_id), 4) as avg_answer_cnt
from 
user_profile  as up 
JOIN
question_practice_detail as qd on up.device_id =  qd.device_id
group by 
up.university
order by 
up.university
````

[牛客题目链接](https://www.nowcoder.com/practice/88aa923a9a674253b861a8fa56bac8e5?tpId=199&tqId=1975674&sourceUrl=%2Fexam%2Foj)

### 统计每个学校各难度的用户平均刷题数

以下是修复后的Markdown内容，保持引用格式，优化了表格展示和换行：

> 题目：运营想要计算一些参加了答题的不同学校、不同难度的用户平均答题量，请你写SQL取出相应数据
>
> 用户信息表：user_profile
>
> | id | device_id | gender | age | university | gpa | active_days_within_30 | question_cnt | answer_cnt |  
> |----|-----------|--------|-----|------------|-----|-----------------------|--------------|------------|  
> | 1  | 2138      | male   | 21  | 北京大学   | 3.4 | 7                     | 2            | 12         |  
>
> 题库练习明细表：question_practice_detail
>
> | id | device_id | question_id | result |  
> |----|-----------|-------------|--------|  
> | 1  | 2138      | 111         | wrong  |  
>
> 表：question_detail
>
> | id | question_id | difficult_level |  
> |----|-------------|-----------------|  
> | 1  | 111         | hard            |  
>
> 请你写一个SQL查询，计算不同学校、不同难度的用户平均答题量，根据示例，你的查询应返回以下结果(结果在小数点位数保留4位，4位之后四舍五入)：
>
> | university | difficult_level | avg_answer_cnt |  
> |------------|-----------------|----------------|  
> | 北京大学   | hard            | 1.0000         |

题目要求 :
1. 首先需要 `up` 表的 `university`
2. 另外需要 `qd` 表的 `diffcult`
3. 其次需要计算 `count(same-diffcult-question) / count(same-university-device-id)`

思路 :
1. 对于三张表的查询 , 我们先优化到 两张表的查询，`拆子问题` , 我们可以先聚合 `qd` 和`qpd` 这两张表 , 知道每个 `题目的难度`
2. 相当于我们聚合了一张 `带有难度信息的 qpd`
3. 然后我们使用 这个`new qpd` 再去和 `UP` 聚合计算一下 对应的 `question_id/device_id group by (university, diffcult)` 即可

````sql
select up.university, temp.difficult_level, count(temp.question_id) / count(distinct up.device_id) as avg_answer_cnt
from user_profile as up
join 
(
select qpd.device_id,qpd.question_id, qd.difficult_level
from
question_practice_detail as qpd 
join 
question_detail as qd
on qpd.question_id = qd.question_id 
)  as temp 
on up.device_id = temp.device_id
group by up.university, temp.difficult_level 
order by up.university
````

[牛客题目链接](https://www.nowcoder.com/practice/5400df085a034f88b2e17941ab338ee8?tpId=199&tqId=1975675&sourceUrl=%2Fexam%2Foj)

[牛客经验+1](https://www.nowcoder.com/practice/f4714f7529404679b7f8909c96299ac4?tpId=199&tqId=1975676&sourceUrl=%2Fexam%2Foj)


## 组合查询

###  查找山东大学或者性别为男生的信息

以下是修复后的Markdown内容，保持引用格式并优化表格展示：

> 题目：现在运营想要分别查看学校为山东大学或者性别为男性的用户的device_id、gender、age和gpa数据，请取出相应结果，结果不去重。
>
> 示例：user_profile
>
> | id | device_id | gender | age | university | gpa | active_days_within_30 | question_cnt | answer_cnt |  
> |----|-----------|--------|-----|------------|-----|-----------------------|--------------|------------|  
> | 1  | 2138      | male   | 21  | 北京大学   | 3.4 | 7                     | 2            | 12         |  
>
> 根据示例，你的查询应返回以下结果（注意输出的顺序，先输出学校为山东大学再输出性别为男生的信息）：
>
> | device_id | gender | age | gpa |  
> |-----------|--------|-----|-----|  
> | 5432      | male   | 25  | 3.8 |  

题目要求 :
1. 连续查两遍这个表, 第一遍是 `山东大学`, 第二遍是`男性` 然后组合输出

思路 :
1. 一开始以为是 `SELECT WHERE OR` 的形式,但是发现
   2. 第一, 不能查重复数据 ,即`山东大学` 和 `male` 如果是一条数据,应该查出两条
   3. 第二不好排序,因为`UNIVERSITY` 

2. 这题纯属新知识点 `UNION ALL` 不去除重复数据 ,`UNOIN` 去除重复数据
````SQL
select device_id, gender,age, gpa
from user_profile
where university = '山东大学'
union all 
select device_id, gender, age , gpa 
from user_profile 
where gender = 'male'
````

[牛客题目链接](https://www.nowcoder.com/practice/979b1a5a16d44afaba5191b22152f64a?tpId=199&tqId=1975677&sourceUrl=%2Fexam%2Foj)

## 留坑
1. `JOIN` ,`LEFT JOIN`, `RIGHT JOIN` 
2. 子查询 ,`视图`的概念
3. `UNION ALL`的性能 ,业务上的使用
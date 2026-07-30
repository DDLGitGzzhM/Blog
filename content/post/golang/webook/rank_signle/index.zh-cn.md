---
title: "单机热榜"
description: 单机热榜的设计与实现
date: 2026-07-30
slug: signle-rank-0x01
categories:
    - golang
    - time-line
tags: [
]
---

高频面试题：如果要你找出按照点赞数量前 N 个数据，怎么做？

设计一个高性能方案, 要求 :

**综合考虑可以怎么利用缓存**，包括 Redis 和本地缓存。要想清楚，你这个缓存方案拿出去面试究竟有没有竞争力，有没有让面试官眼前一亮的点

**允许业务折中**，但是你要说清楚你准备怎么折中


## ZSet 存储

我们在用户请求点赞 URL 之后, 使用 ZSET 进行维护一个点赞集合 。 使用 lua 脚本控制 `check-dothing` 的并发问题

如果请求的 `key` 不存在, 则查找数据库将已有的 value 写入到 zset 中

```lua
local zsetName = KEYS[1]  -- 有序集合的名称
local memberToIncrement = ARGV[1]   -- 要增加分数的元素
-- 获取指定元素的当前分数
local currentScore = redis.call("ZSCORE", zsetName, memberToIncrement)

if currentScore then
    -- 将分数加1
    local newScore = currentScore + 1
    -- 更新有序集合中指定元素的分数
    redis.call("ZADD", zsetName, newScore, memberToIncrement)
    return newScore
else
    -- 指定元素不存在
    return 0
end
```

如果不存在那么需要把 value 写入到 zset 中

1. 先判断 set-key 是否存在

2. 如果存在 判断 key 是否有统计，如果有则 +1 否则 设置 value

```lua
local zsetName = KEYS[1]                     -- 有序集合的名称
local memberToIncrement = ARGV[1]            -- 要增加分数的元素
local specifiedScore = tonumber(ARGV[2])     -- 指定的分数，如果未指定则默认为1

-- 检查有序集合是否存在，如果不存在则创建并设置指定元素的分数
local exists = redis.call("EXISTS", zsetName)
if exists == 0 then
    redis.call("ZADD", zsetName, specifiedScore, memberToIncrement)
    return specifiedScore
end

-- 获取指定元素的当前分数
local currentScore = redis.call("ZSCORE", zsetName, memberToIncrement)

if currentScore then
    -- 如果元素存在，将分数加1
    local newScore = currentScore + 1
    redis.call("ZADD", zsetName, newScore, memberToIncrement)
    return newScore
else
    -- 如果元素不存在，将分数设置为指定的分数
    redis.call("ZADD", zsetName, specifiedScore, memberToIncrement)
    return specifiedScore
end
```

## 读取

通过使用 `ZRevRangeWithScores` 来获取前 100 的数据进行获取 topN 的数据

```go
func (r *RedisInteractiveCache) LikeTop(ctx context.Context, biz string,) ([]domain.Interactive, error) {
	var start int64 = 0
	var end int64 = 99
	key := r.rankingKey(biz)
	res, err := r.client.ZRevRangeWithScores(ctx, key, start, end).Result()
	if err != nil {
		return nil, err
	}
	interactives := make([]domain.Interactive, 0, 100)
	for i := 0; i < len(res); i++ {
		id, _ := strconv.ParseInt(res[i].Member.(string), 10, 64)
		interactives = append(interactives, domain.Interactive{
			Biz:     biz,
			BizId:   id,
			LikeCnt: int64(res[i].Score),
		})
	}
	return interactives, nil
}
```

**优化 :**

1. 我们业务上只需要  top100  可以考虑只维护 前1000的数据。 使用 `ZREMRANGEBYRANK` 删除 > 1000的内容

2. 最坏情况下，无非就是冷门文章爆火，需要查一次数据库 。 但是爆火的冷门文章并发并不是很高

## 问题

1. 前 100 名是一个高频数据

2. 如果有 一亿个 数据怎么维护 ？ 

我们假设 100b 一条数据， 100w 条就是 100mb , 1000w 条就是 1gb .  1亿条就是 10gb 这很夸张了

### 前 100 名的维护

可以结合一个本地缓存，使用定时任务更新本地缓存。 例如 每 5s 调用一次 `topN` 函数，放进本地缓存中

本地缓存的实现

```go
type cacheImpl[T any] struct {
	result         sync.Map // [string]cacheResult[T]
	successTimeout time.Duration
	failTimeout    time.Duration
	lock           sync.Mutex
	lockMap        map[string]*sync.Mutex
}
```

### 一亿个数据

1. 分 key 写入 . 我们在写入数据的时候 按照每 100个元素一个。set 进行分 key 处理

2. 业务折中 。 并不是真的维护一亿，而是维护近期的点赞数据 例如 3天内的 。 

    - 这里可以考虑算法过期 例如  `likecnt / (age + 2) ^ gravity`

    - 或者是考虑整个 key 过期

```go
func (r *RedisInteractiveCache) IncrRankingIfPresentV1(ctx context.Context, biz string, bizId int64, error {
	h := fnv.New32a()
	_, _ = h.Write([]byte(bizId))
	key := fmt.Sprintf("top_100_%d_%s", h.Sum32()%100, biz)
	res, err := r.client.Eval(ctx, luaRankingIncr, []string{key}, bizId).Result()
	if err != nil {
		return err
	}
	if res.(int64) == 0 {
		return RankingUpdateErr
	}
	return nil
}
```

分key 版本的读取

每次从同一个业务中的 100 个分key 中获取前100的数据，然后再合并出前100的数据

```go
func (r *RedisInteractiveCache) LikeTopV1(ctx context.Context, biz string,) ([]domain.Interactive, error) {
	// 我从 100 个 key 里面，各取前 100
	// 然后，合并再取前 100
	interactives := make([]domain.Interactive, 0, 100*100)
	for i := 0; i < 100; i++ {
		var start int64 = 0
		var end int64 = 99
		key := fmt.Sprintf("top_100_%d_%s", i, biz)
		res, err := r.client.ZRevRangeWithScores(ctx, key, start, end).Result()
		if err != nil {
			return nil, err
		}
		for j := 0; j < len(res); j++ {
			id, _ := strconv.ParseInt(res[j].Member.(string), 10, 64)
			interactives = append(interactives, domain.Interactive{
				Biz:     biz,
				BizId:   id,
				LikeCnt: int64(res[j].Score),
			})
		}
	}
	// 进一步排序，然后取前 100
	return interactives, nil
}
```




### 其他

借助定时计算，每次计算1000名，使用 Zset 来维护 1000 名的分数 

## 总结

Q : 你是如何设计一个高性能的 排行榜服务

我们使用 Zset 进行维护, 每次用户点赞的时候 会去操作一次 Zset 如果 Zset 不存在会获取数据库中的数据进行补充 。 

对外提供一个 TopN 的函数用于获取 topN 的数据。

1. 使用 本地缓存 + 使用定时任务每5s 维护 Zset TopN 的任务 。 

2. 对于大数据结构，我们采用了 分 key 的方案 , 并且考虑业务折中的方案 我们只维护最近3天的数据 。 对于超过 3 天的数据，我们会进行整 key 过期 。 如果有业务需求，可以考虑使用算法过期 

3. 对于数据的读取，每次获取同一个业务中 100 个key内的 前100的数据，合并后再去前 100 的数据

4. 由于我们业务只需要前 100 的数据。 所以我们对于每一个 topN 维护一个 1000 数量的 Zset 。通过使用。ZREMRANGEBYRANK 进行裁剪优化


## 总分：**62 / 100**（按「2 年 Go 后端」面试深度）

能讲清 ZSet + 本地缓存 + 业务折中，达到中级入门；但并发正确性、分片收益、读路径细节经不起追问，离「眼前一亮」还有距离。

---

### 分项（供对照）

| 维度 | 分 | 说明 |
|------|-----|------|
| 问题建模 | 14/20 | 点到高频读、亿级内存，缺一致性与降级 |
| 方案设计 | 16/25 | ZSet / 本地缓存 / 分片方向对，收益与边界说不清 |
| 正确性与并发 | 10/20 | Lua / 冷启动 / 裁剪与回写有明显漏洞 |
| 缓存竞争力 | 12/20 | 有本地缓存+定时刷新，缺亮点与可落地细节 |
| 表达与代码 | 10/15 | 结构尚可，代码未完成、笔误多 |

---

### 优点

1. **选型合理**：点赞排行用 Redis ZSet + `ZRevRangeWithScores`，是面试官期望的标准答案。
2. **有业务折中意识**：只维护 Top1000、近 3 天、时间衰减公式，比死磕「全量精确」更像有线上经验。
3. **意识到读热点**：Top100 用本地缓存 + 定时刷新，方向正确。
4. **有规模感**：用「100B × 条数 ≈ 内存」估算，说明想过容量，而不是只背 API。
5. **分片合并思路**：每分片取 TopK 再归并，全局 Top100 在理论上是成立的（全局 Top100 一定落在各分片 Top100 里）。

---

### 缺点（面试深挖会挂的点）

**1. 写路径 / Lua 正确性不足**

- 第一段脚本：member 不存在就 `return 0`，和「key 不存在回源 DB」混在一起，边界说不清。
- `EXISTS` + 回源 + `ZADD` 有典型竞态：多请求同时发现 key 不存在，会重复回源、互相覆盖。
- 直接 `ZINCRBY` 通常更简单；自己做 `ZSCORE` + `ZADD` 却没讲清为何不用原子自增。
- 冷门突爆「并发不高」不能当结论，面试官会问：缓存击穿 / 单飞 / 互斥回源怎么做？

**2. 分 Key 没有真正解决「10GB」问题**

- 分 100 个 key 只是**摊内存到多实例/多槽**，总量仍约 10GB，除非配合「每分片只留 Top1000 + 时间窗」。
- 文档里「分 key」和「裁剪 1000 / 只保 3 天」缠在一起，容易被问成：分片到底解决什么？裁剪丢了的 member 再点赞怎么回写？

**3. 读路径代码与叙述不一致**

```166:189:content/post/golang/webook/rank_signle/index.zh-cn.md
// ... 注释写合并再取前 100
return interactives, nil  // 实际未排序、未截断
```

- 100 次串行 `ZRevRange`，没提 Pipeline / 并发，高 QPS 下这是减分项。
- `h.Write([]byte(bizId))`：`bizId` 是 `int64`，这样写编译都过不了，暴露准备粗糙。

**4. 「眼前一亮」的缓存方案偏薄**

- 本地缓存只给了结构体字段，没有：过期策略、失败降级、单飞、多实例一致性、Redis 挂了怎么办。
- 5s 定时刷新可以，但要主动说清楚：**最多 5s 脏读**、是否可接受、写后是否主动失效。

**5. 总结段有自相矛盾**

- 一边「只维护近 3 天」，一边「每个 topN 维护 1000 的 ZSet 裁剪」——没串成一条清晰主路径（写什么、裁什么、读什么、何时过期）。

---

### 建议（按面试表述优先级改）

**先定一条主链路（30 秒版本）**

> 点赞写：`ZINCRBY`（或 Lua 原子自增）→ 可选裁剪到 TopK → 读：本地缓存 Top100（定时/主动刷新）→ Redis 兜底 → 业务只保证近 N 天、允许秒级延迟。

**补齐会被追问的 5 个点**

1. **冷启动**：key 不存在时 singleflight / 分布式锁回源，防止击穿。  
2. **与点赞主链路一致性**：双写失败怎么补偿（异步对账 / 消息队列重放）。  
3. **分片收益**：说清是「内存分散 + 裁剪」还是「近似排行」；读用 Pipeline。  
4. **本地缓存**：成功/失败 TTL、刷新抖动、降级返回旧数据。  
5. **降级**：排行挂了不影响点赞主流程（熔断、开关、返回空或历史快照）。

**代码准备**

- 把 `LikeTopV1` 补完：归并堆 / `sort` + 截断 Top100。  
- 分片 key 用 `strconv.FormatInt`；Lua 收敛成一种语义讲透。  
- 修标题笔误 `signle` → `single`，避免细节减分。

**想加分的「亮点」（选 1～2 个讲深）**

- 读写分离：写只碰分片 ZSet，读只碰「聚合后的 Top100 专用 key」（定时任务算好写入），线上读路径 O(1)。  
- 或：消息异步更新排行，点赞接口不直连大 ZSet，用最终一致性换写吞吐。

---

### 面试官一句话结论

作为 2 年经验的准备稿：**骨架有了（约及格偏上），深度和正确性不够**。把「并发回源、分片真实收益、读合并实现、一致性与降级」补成能闭环口述的一条故事，分数可以到 **75～80**；再补上「聚合 Top key / 异步更新」一类可落地亮点，才接近「眼前一亮」。

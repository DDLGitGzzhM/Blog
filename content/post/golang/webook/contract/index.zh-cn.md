---
title: "关注 detail"
description: 我们项目实现了一个 xxxx 
date: 2026-08-08
slug: contract-0x01
categories:
    - golang
    - time-line
tags: [
  "gold",
  "webook-detail"
]
---

## 简历 preview

简历上 : 实现了一个完整的用户关系功能


需求分析 :

大部分平台为了提供 社交互动、个性化体验，内容传播 

这一部分功能被称为用户关系

积极用法 ： 关注

消极用法 : 屏蔽或者拉黑，从系统设计的角度来说没有本质的区别





### 设计难点

高并发 : 每打开一篇文章，都要判定你是否关注了这个创作者 

大数据 : 假设每个用户平均会关注100个人，那么关注数据的行数就是用户数的100倍

### 功能 & 表结构设计

**关注功能设计 :**

1. 关注, 取消关注

2. 获取某个人的关注列表, 获取某个人关注另外一个人的详细信息 

3. 获取某人的粉丝列表, 获取默认的关注人数

```proto
service FollowService {
  // 增删
  rpc Follow (FollowRequest) returns (FollowResponse);
  rpc CancelFollow(CancelFollowRequest) returns (CancelFollowResponse);

  // 改，例如说你准备支持备注、标签类的，那么就会有对应的修改功能

  // 获得某个人的关注列表
  rpc GetFollowee (GetFolloweeRequest) returns (GetFolloweeResponse);
  // 获得某个人关注另外一个人的详细信息
  rpc FollowInfo (FollowInfoRequest) returns (FollowInfoResponse);
  // 获取某人的粉丝列表
  rpc GetFollower (GetFollowerRequest)returns(GetFollowerResponse );
  // 获取默认的关注人数
  rpc GetFollowStatic(GetFollowStaticRequest)returns(GetFollowStaticResponse);
}
```


**表结构设计 :**

索引设计

1. 创建联合唯一索引 `follwer_followee` 这个索引用于查看所有关注的人

2. 并且反向创建一个普通索引 `followee_follwer` 这个索用于查看谁关注了我

```go
type FollowRelation struct {
	ID int64 `gorm:"primaryKey,autoIncrement,column:id"`

	Follower int64 `gorm:"type:int(11);not null;uniqueIndex:follower_followee,priority:1;index:followee_follower,priority:2"`
	Followee int64 `gorm:"type:int(11);not null;uniqueIndex:follower_followee,priority:2;index:followee_follower,priority:1"`

	Status uint8

	// 这里你可以根据自己的业务来增加字段，比如说
	// 关系类型，可以搞些什么普通关注，特殊关注
	// Type int64 `gorm:"column:type;type:int(11);comment:关注类型 0-普通关注"`
	// 备注
	// Note string `gorm:"column:remark;type:varchar(255);"`
	// 创建时间
	Ctime int64
	Utime int64
}
```

### 功能实现

#### 关注某人

DB 创建的时候 维护 Upsert 语意 进行创建关注关系

```go
func (g *GORMFollowRelationDAO) CreateFollowRelation(ctx context.Context, f FollowRelation) error {
	now := time.Now().UnixMilli()
	f.Utime = now
	f.Ctime = now
	f.Status = FollowRelationStatusActive
	return g.db.WithContext(ctx).Clauses(clause.OnConflict{
		DoUpdates: clause.Assignments(map[string]any{
			"utime":  now,
			"status": FollowRelationStatusActive,
		}),
	}).Create(&f).Error
}
```

使用 TxPipeline 实现双写两个 Map 。 关注者和粉丝 单独维护两个 HMap

```go
func (r *RedisFollowCache) updateStaticsInfo(ctx context.Context, follower, followee int64, delta int64) error {
	tx := r.client.TxPipeline()
	// 增加 follower 的关注多少人的数量
	tx.HIncrBy(ctx, r.staticsKey(follower), fieldFolloweeCnt, delta)
	// 增加 followee 被多少人关注的数量
	tx.HIncrBy(ctx, r.staticsKey(followee), fieldFollowerCnt, delta)
	_, err := tx.Exec(ctx)
	return err
}
```

#### 取消关注

DB 层面只需要更新一下 status 即可

```go
func (g *GORMFollowRelationDAO) UpdateStatus(ctx context.Context, followee int64, follower int64, status uint8) error {
	now := time.Now().UnixMilli()
	return g.db.WithContext(ctx).
		Where("follower = ? AND followee = ?", follower, followee).
		Updates(map[string]any{
			"status": status,
			"utime":  now,
		}).Error
}

```

Cache 层面同样使用, HIncryBy 进行-1

```go
func (r *RedisFollowCache) CancelFollow(ctx context.Context, follower, followee int64) error {
	return r.updateStaticsInfo(ctx, follower, followee, -1)
}
```

#### 查询 & 缓存


##### 获取关注列表

这个功能不需要缓存 


1. 没有人会频繁去看这个功能 缓存效率低

2. 分页接口不好缓存

```go
func (g *GORMFollowRelationDAO) FollowerRelationList(ctx context.Context,
	followee, offset, limit int64) ([]FollowRelation, error) {
	var res []FollowRelation
	err := g.db.WithContext(ctx).
		Where("followee = ? AND status = ?", followee, FollowRelationStatusActive).
		Offset(int(offset)).Limit(int(limit)).
		Find(&res).Error
	return res, err
}

```
##### 关注数量和粉丝数量


1. 借助 Redis + 兜底 Count 功能来计算关注数量和粉丝数量


通过 HGetAll 直接获取 Uid 的粉丝数量和关注数量 然后返回

```go
func (r *RedisFollowCache) StaticsInfo(ctx context.Context, uid int64) (domain.FollowStatics, error) {
	data, err := r.client.HGetAll(ctx, r.staticsKey(uid)).Result()
	if err != nil {
		return domain.FollowStatics{}, err
	}
	// 也认为没有数据
	if len(data) == 0 {
		return domain.FollowStatics{}, ErrKeyNotExist
	}
	// 理论上来说，这里不可能有 error
	followerCnt, _ := strconv.ParseInt(data[fieldFollowerCnt], 10, 64)
	followeeCnt, _ := strconv.ParseInt(data[fieldFolloweeCnt], 10, 64)
	return domain.FollowStatics{
		Followees: followeeCnt,
		Followers: followerCnt,
	}, nil
}
```

慢查询就是需要去确认DB, DB查询结束之后再回写缓存 
```go
func (g *GORMFollowRelationDAO) CntFollower(ctx context.Context, uid int64) (int64, error) {
	var res int64
	err := g.db.WithContext(ctx).
		Select("count(follower)").
		Where("followee = ? AND status = ?",
			uid, FollowRelationStatusActive).Count(&res).Error
	return res, err
}
```

```go
func (d *CachedRelationRepository) GetFollowStatics(ctx context.Context, uid int64) (domain.FollowStatics, error) {
	// 快路径
	res, err := d.cache.StaticsInfo(ctx, uid)
	if err == nil {
		return res, err
	}
	// 慢路径
	res.Followers, err = d.dao.CntFollower(ctx, uid)
	if err != nil {
		return res, err
	}
	res.Followees, err = d.dao.CntFollowee(ctx, uid)
	if err != nil {
		return res, err
	}
	err = d.cache.SetStaticsInfo(ctx, uid, res)
	if err != nil {
		// 这里记录日志
		d.l.Error("缓存关注统计信息失败",
			logger.Error(err.Error()),
			logger.Int64("uid", uid))
	}
	return res, nil
}
```

### 难点尝试解决

我们之前提到的 用户关系的量级 和 用户本身还要高一个数量级  。单表肯定是不可以的 因此需要考虑

1. 分库分表
2. 换用别的存储中间件

我们这里可以采用 TableStore 进行存储。 


部分代码如下，无非是把分库分表的操作丢给了第三方应用

```go
func (t *TableStoreFollowRelationDao) UpdateStatus(ctx context.Context, followee int64, follower int64, status uint8) error {
	cond := tablestore.NewCompositeColumnCondition(tablestore.LO_AND)
	cond.AddFilter(tablestore.NewSingleColumnCondition("follower", tablestore.CT_EQUAL, follower))
	cond.AddFilter(tablestore.NewSingleColumnCondition("followee", tablestore.CT_EQUAL, followee))
	req := new(tablestore.UpdateRowChange)
	req.TableName = FollowRelationTableName
	req.SetCondition(tablestore.RowExistenceExpectation_EXPECT_EXIST)
	req.SetColumnCondition(cond)
	req.PutColumn("status", int64(status))
	_, err := t.client.UpdateRow(&tablestore.UpdateRowRequest{
		UpdateRowChange: req,
	})
	return err
}
```

## 面试

- 总结类似于 维护计数的方案

- 如何优化 COUNT 查询 ？
  
  - Redis 直接维护结果 避免 COUNT
  - 利用索引

- Redis 的 Pipeline 是什么 ？ Transaction 又是什么 ？ 用来解决什么问题 ？ 
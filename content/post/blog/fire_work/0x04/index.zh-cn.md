---
title: "垃圾中堆找黄金"
description: dirty work 中寻找一些闪光点
date: 2026-07-08
slug: fire-workd-04
categories:
    - summary
    - time-line
tags: [
    "工作"
]
---

说实话没有什么比较好的思路能够一下子整理出工作中的闪光点

目前能想到的切入点

- 人脑回忆这两年的Backlog
- 从上到下扫描这两年全部的Backlog
- 根据产品季度目标 PO-backlog 来整理

预计采用的方案是

1+3,如果数量不够可能会使用 2进行补充

## 开始回忆

### 账户暂停

我们系统内部维护一个 Account Api 状态

包括 `只读`,`归档`,`Error`,`交易`

需要增加一个账户`暂停`的状态，把`归档`的状态下掉，为什么下掉`归档`忘记了，看着是从业务理解层面上下掉的

暂停的账户需要停止

1. 资产的更新
2. 记录的抓取

印象中是做了

1. 在 Account 表中增加一列 boolean 表示账户是暂停还是启动
2. 在 Collector Account Monitor 中根据账户的状态进行控制是否要进行资产更新
3. 在 Fetch Data Monitor 中根据账户的状态进行控制是否要进行抓取记录


**这里感觉不对 :**

优化了一下流程

1. 写了一个 prompts 然后把对应任务的 pr丢给他 让他分析

这次改动做了什么

1. 通过 `migration` 给涉及到的3张Account数据库表增加 `state` 的列
2. 处理相关下游模块的 暂停程序 `collector` , `monitory` , `api hook`
3. 通过 go 一个 `migrateArchivedToPaused` 将历史归档状态的账户改成暂停的账户

亮点 :

1. 复杂领域模型的状态及设计，因为涉及到 `子账户暂停母账户才可以暂停`
2. 跨模块一致性改造
3. 存量数据迁移

#### 个人想法

理了一下这个backlog，感觉并不是很惊艳，只能说涉及到的模块多，下游设计到的多，导致做的周期比较长比较大

我感觉可以把 `migration` 单独提出来说一下，可以去挖一下我们公司 `migration` 的实现

### Ai总结

主导 CeFi 账户 Pause/Resume 端到端设计与实现，将原先混用的「归档」语义拆分为运行态（Normal/Paused）与 API 权限态，新增 DB 三字段并完成 v2.171 migration。实现 Prop/Sub 级联状态机、恢复前 API 复检、事务与业务日志；改造 Collector 与 Monitor 共 6+ 后台 Job，暂停账户停止资产拉取与 API 巡检；完成归档账户存量迁移及多轮生产 bugfix，保障 v2.171 稳定上线。


### Async 

#### 背景

交易所接口的实时查询接口只能够查询最近3个月的数据，如果想要获取更早的数据需要透过异步接口获取

1. 请求下载ID | 这一步一个月有次数限制，而且IP权重很高
2. 根据请求下载ID 去请求下载链接 

#### 整理

整体思路

```
REST 入口（统一限流/配额/落库）
    ↓
DownloadId 工厂（exg + dataType → handler）
    ↓
Redis 队列（解耦「申请」与「轮询下载」）
    ↓
后台 Scan Job（轮询 + 下载 + 重试）
    ↓
MQ → Consumer（CSV 解析 → 标准 OTS 格式 → 入库）
```

亮点

1. Redis 队列进行接藕操作
2. 任务每次在发版 进程重新启动的时候进行Recover
3. 状态机驱动 `not_started → packaging_data → downloading → importing → succeed/failed，含 packaging_data_with_error`
4. 双层配额控制

    - 进程级 : `rate.Limiter` 一分钟一次，防止误操作
    - 账户级 : Redis 控制自然月计数 

5. Mock 测试体系

#### AI一句话总结

设计并实现 CAM 加密资产管理系统历史数据异步拉取引擎（Go / Redis / PostgreSQL / MQ）：从 0 搭建 Binance/OKX/Bybit 异步导出全链路（申请 → 轮询 → 下载 → CSV 解析入库），含双层配额控制、Redis 队列解耦、PG 状态机与发版容错恢复；支撑对账与历史回溯，模块累计 100+ 次生产迭代。

### Auth 升级

#### 背景说明

我们的 Apikey 铭感信息 都存放到 Auth 服务器上，之前 Auth 服务器上的 APikey_1 表数据太脏了

1. apikey 不是存放在prop层级的，而是母子层级都可能存在

现在想要升级 apikey_1 为 apikey_2

1. 希望所有 apikey 都收拢到 prop层级上面

--

C交易所账户有层级结构：Prop 母账户（如 bnprop）下挂多个子账户（如 binancef、binanced）。原先每个子账户都要单独配置 API Key，运维成本高、易出错。

这套改动实现：子账户自动复用 Prop 母账户的 API 凭证，并支持复制已有 Prop 账户创建新账户，同时完成 Auth 服务从 V1 到 V2 的平滑迁移。

#### 整理

存储层 : 新增 account_apikey_2 表

Auth Server 层 : 新增 Copy Api 的功能,暴露出copy-api的接口

Auth Client 层 : 封装 Copy 调用， V1/V2 自动切换

业务层 : CopyHelper 统一调度：读 Key、写 Key、复制账户

观测层 : 给每一个回退增加统计

**核心决策设计 :**

1. 双表并存，平滑迁移

    - V1（account_apikey）与 V2（account_apikey_v2）共存
    - 支持 V1→V1、V2→V2、V1→V2 三种 Copy 路径
    - 客户端按 Auth 版本自动路由，V1 读不到时自动 V1→V2 迁移

2. 灰度发布

    - CopyRegionControl() 控制 master 环境先上线
    - 后续通过 Auth 版本检测自动切换 V2

#### 个人想法

这个功能比较难做，涉及到的模块很多，而且 更新 新增 删除 apikey 暴露给了很多地方，还需要做版本控制

导致改动的地方很多

#### Ai总结
负责设计并实现交易账户 API Key 共享能力，解决 Prop 母账户与子账户重复配置凭证的问题。新建 account_apikey_v2 存储层，提供 V1/V2 双版本 Copy API；在 tradeacc、auth_client、交易所 Sign 模块实现统一 CopyHelper，支持子账户自动复用 Prop 凭证及复制开户；设计 V1→V2 平滑迁移与降级回退，配合 Feature Toggle 灰度发布；新增 Copy 降级监控指标。涉及 5 个核心模块、1,000+ 行代码，6 天内分 4 个 PR 交付。


### Trans 表优化

#### 背景

成交表的数据有很多，一个客户一天的数据甚至就能到百万级别的了，需要优化一下存储

我们Trans表主要存储 `id,business_id,account,time,detail`这几个字段，之前 detail 是直接存储的交易所的原始返回

所以主要是优化这部分内容，通过压缩存储来进行优化

压缩算法和测试是运维那边来处理的（后续需要去看一下）

#### 整理

我们存在两个结构一个 是 `ec.OTSTrans` 供给上层业务组使用 一个是 `db.Trans` 用于存储

1. 新增 SlimOTSTrans，将 `ec.OTSTrans` 的 jsontag 改为短JSON名处理例如 `a/b/c...` 
2. 在 OTSTransToDB 的时候使用 Compressor 进行控制
3. 新增 `blob` 和 `blob_format` 列用于表示是否是压缩内容 以及存入压缩内容
4. 将detail字段进行私有化控制，全部业务层统一使用 `GetDetails()`和`SetDetails()`进行访问

流程
写入时：JSON → Slim 序列化 → 压缩 → 写入 blob，清空 details；读取时：按 blob_format 自动解压还原

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: JSON 字段瘦身 (SlimOTSTrans 短字段名)          │
├─────────────────────────────────────────────────────────┤
│  Layer 2: 二进制压缩 (xz / zstd / vanilla)               │
├─────────────────────────────────────────────────────────┤
│  Layer 3: 存储分离 (details 清空 → blob 存压缩数据)      │
└─────────────────────────────────────────────────────────┘
                          ↓
              blob_format 标识格式，统一读写入口
                          ↓
         blob_format=0 读旧 details（向后兼容）
         blob_format>0 读 blob 解压（新数据）
```

架构与设计

全链路存储优化：不是简单「加个 gzip」，而是从 JSON 结构、压缩算法、DB Schema、读写 API 到 20+ 下游模块的系统性改造。

向后兼容设计：blob_format 双轨读写，支持新旧数据共存，生产可渐进迁移。

零拷贝转换：SlimOTSTrans 与 OTSTrans 通过 unsafe.Pointer 转换，并用 init() 校验 struct layout，兼顾性能与安全。

#### Ai总结
1. 设计并实现 CAM 历史交易流水存储优化：Slim JSON 瘦身 + zstd/xz 压缩 + blob 分离存储，解决核心表存储与 I/O 瓶颈。

2. 通过 blob_format 双轨兼容设计实现零停机迁移，重构 40+ 下游模块统一读写接口，开发 CLI 批量迁移工具并完成多环境灰度发布。

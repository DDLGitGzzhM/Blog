---
title: "[LeetCode][hot100] 图论"
description:  图论
date: 2026-08-11
slug: leetcode-map-0x01
categories:
    - algorithm
    - time-line
tags: [
  "leetcode-hot100",
]
---
## 200. 岛屿数量

[岛屿数量](https://leetcode.cn/problems/number-of-islands/description/?envType=study-plan-v2&envId=top-100-liked)

思路 :

1. 使用 标记数组 标记每一个走过的路地 ，并且计数。

2. 如果没有走过路地，那么从当前路地节点走一遍bfs 跑完所有路地节点 。 

```cpp
#define x first
#define y second
typedef pair<int,int> PII ;

const int N = 310 ;
bool st[N][N];
int cnt ;
PII q[N*2];
int n,m;
void init() {
    memset(st,0,sizeof(st)); 
    cnt = 0 ;
    n = 0 ;
    m = 0 ;
}

int wx[] = {1,-1,0,0} ;
int wy[] = {0,0,1,-1};

void bfs(int sx,int sy,vector<vector<char>>& g) {
    int hh  = 0 , tt = 0 ;
    q[0] = {sx,sy};
    st[sx][sy] = 1 ;
    
    while(hh <= tt) {
        PII t = q[hh ++ ];
            for(int i = 0 ; i < 4 ; i ++ ) {
                int dx = t.x + wx[i];
                int dy = t.y + wy[i];

                if(dx < 0 || dx >= n || dy < 0 || dy >= m ) continue;
                if(g[dx][dy] == '0' || st[dx][dy]) continue ;

                q[++tt] = {dx,dy};
                st[dx][dy] = 1;
            }
        }
}

class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        init() ;
         n = grid.size() ;
         m = grid[0].size() ;

        for(int i = 0 ; i < n ; i ++ ) {
            for(int j = 0 ; j < m ; j ++ ) {
                if(grid[i][j] == '1' && !st[i][j]) {
                    bfs(i,j,grid);
                    cnt ++ ;
                }
            }
        }
        return cnt ;
    }
};
```


## 994.腐烂的橘子


[腐烂的橘子](https://leetcode.cn/problems/rotting-oranges/description/?envType=study-plan-v2&envId=top-100-liked)

思路 :

1. 和岛屿数量差不多 。无非是让 烂橘子 进行bfs

2. 计算每个烂橘子到新鲜橘子的最短距离。 然后求一个最大值即可
 
因为 n,m = 10 . 所以直接这样子暴力了


```go
#define x first
#define y second
typedef pair<int,int> PII ;

const int N = 20 ;
const int INF = 0x3f3f3f3f ;

int dist[N][N];
PII q[N*N];
int n,m;

bool st[20][20];
void init() {
    memset(dist,INF,sizeof(dist)); 
    n = 0 ;
    m = 0 ;
}

int wx[] = {1,-1,0,0} ;
int wy[] = {0,0,1,-1};

void bfs(int sx,int sy,vector<vector<int>>& g) {
    memset(st,0,sizeof(st)); 
    int hh  = 0 , tt = 0 ;
    q[0] = {sx,sy};
    dist[sx][sy] = 0 ;
    st[sx][sy] = 1;
    
    while(hh <= tt) {
        PII t = q[hh ++ ];
        for(int i = 0 ; i < 4 ; i ++ ) {
            int dx = t.x + wx[i];
            int dy = t.y + wy[i];
            if(dx < 0 || dx >= n || dy < 0 || dy >= m ) continue;
            if(g[dx][dy] == 0 || g[dx][dy] == 2) continue ;
            if(st[dx][dy]) continue;
            st[dx][dy] = 1; 
            dist[dx][dy] = min(dist[dx][dy], dist[t.x][t.y] + 1);
            q[++tt] = {dx,dy};
        }
    }
}


class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        init(); 
        n = grid.size();
        m = grid[0].size();
    
        for(int i = 0 ; i < n ; i ++ )
            for(int j = 0 ; j < m ; j ++ ) {
                if(grid[i][j] == 2) {
                     bfs(i,j,grid);
                }
        }

        int ans = 0;
        for(int i = 0 ; i < n ; i ++ )
            for(int j = 0 ; j < m ; j ++ ) {
                if(grid[i][j] == 1 ) {
                    if (dist[i][j] == INF)return -1;
                    else ans = max(ans , dist[i][j]);
                }
            }
        return ans ;
    }
};
```

当然也可以使用 多源 bfs 进行优化

```go
class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int n = grid.size(), m = grid[0].size();
        int wx[4] = {1, -1, 0, 0};
        int wy[4] = {0, 0, 1, -1};

        queue<pair<int, int>> q;
        int fresh = 0;

        // 所有烂橘子同时入队，作为多个源点
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                if (grid[i][j] == 2) {
                    q.push({i, j});
                } else if (grid[i][j] == 1) {
                    fresh++;
                }
            }
        }

        if (fresh == 0) return 0;

        int minutes = 0;
        while (!q.empty()) {
            int sz = q.size();
            bool infected = false;

            // 同一分钟内，当前层全部扩散完
            for (int i = 0; i < sz; i++) {
                auto [x, y] = q.front();
                q.pop();

                for (int k = 0; k < 4; k++) {
                    int dx = x + wx[k];
                    int dy = y + wy[k];
                    if (dx < 0 || dx >= n || dy < 0 || dy >= m) continue;
                    if (grid[dx][dy] != 1) continue;

                    grid[dx][dy] = 2;   // 标记已腐烂，避免重复入队
                    q.push({dx, dy});
                    fresh--;
                    infected = true;
                }
            }

            if (infected) minutes++;
        }

        return fresh == 0 ? minutes : -1;
    }
};
```

## 207. 课程表

[课程表](https://leetcode.cn/problems/course-schedule/description/?envType=study-plan-v2&envId=top-100-liked)

思路 :

1. 主要考察的是拓扑排序 

拓扑排序我们的方法是

 1. 查找所有入度为0的点进去队列，然后减少其关联的点

 2. 然后再重新入所有入度为0的点

```go
const int N = 4e3 + 10 ;

int h[N] , e[N], ne[N], idx;

int d[N] ;

int num ;
 
 
void init(){
    memset(h,-1,sizeof(h));
    memset(e,0,sizeof(e));
    memset(ne,0,sizeof(ne));
    memset(d,0,sizeof(d));
    idx = 0 ;
    num = 0 ;
}

// a -> b 
void add(int a,int b) {
    e[idx] = b;
    ne[idx] = h[a];
    h[a] = idx ++ ;
}

bool topsort() {
    int cnt = 0 ;
    queue<int> q;
    for(int i = 0;  i < num ; i ++ ) {
        if(!d[i]) q.push(i);
    }

    while(!q.empty()) {
        int t = q.front() ;
        q.pop () ;
        cnt ++ ;
        for(int i = h[t] ; i!= -1 ; i = ne[i]) {
            int j = e[i] ;
            d[j] -- ;
            if(!d[j]) q.push(j);
        }
    }
    return cnt == num; 
}


class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        init(); 
        num = numCourses ; 

        for(auto x : prerequisites) {
            int a = x[0];
            int b = x[1];
            add(a,b);
            d[b] ++ ;
        }

        return topsort();
    }
};
```



## 208. 实现 Trie (前缀树)

[实现 Trie (前缀树)](https://leetcode.cn/problems/implement-trie-prefix-tree/description/?envType=study-plan-v2&envId=top-100-liked)

Tire 的实现思路

1. 定义 son[p][u] ; 表示第 p 层节点是否有值 u 

2. 然后再进行顺序即可

```cpp
class Trie {
static const int N = 4e4 + 10 ;
int son[N][26];
int idx ;
bool isEnd[N];

public:
    Trie() {
        memset(son,0,sizeof(son));
        memset(isEnd,0,sizeof(isEnd));
        idx = 0 ;
    }   
    
    void insert(string word) {
        int p = 0 ;
        for(auto x : word) {
            int u = x-'a';
            if(!son[p][u]) son[p][u] = ++idx; 
            p = son[p][u];
        }
        isEnd[p] = 1; 
    }
    
    bool search(string word) {
        int p = 0 ;
        for(auto x : word) {
            int u = x-'a';
            if(son[p][u]) p = son[p][u];
            else return false;
        }
        return isEnd[p];
    }
    
    bool startsWith(string prefix) {
        int p = 0 ;
        for(auto x : prefix) {
            int u = x-'a';
            if(son[p][u]) p = son[p][u];
            else return false;
        }
        return p ; 
    }
};

/**
 * Your Trie object will be instantiated and called as such:
 * Trie* obj = new Trie();
 * obj->insert(word);
 * bool param_2 = obj->search(word);
 * bool param_3 = obj->startsWith(prefix);
 */
```
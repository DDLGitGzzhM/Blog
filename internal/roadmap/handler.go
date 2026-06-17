package roadmap

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler exposes HTTP endpoints for local roadmap editing.
type Handler struct {
	store *Store
}

// NewHandler creates a Handler.
func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

// Register mounts routes on the given router group.
func (h *Handler) Register(rg *gin.RouterGroup) {
	rg.GET("/health", h.health)
	rg.GET("/roadmaps", h.listRoadmaps)
	rg.GET("/roadmap/:id", h.getRoadmap)
	rg.PUT("/roadmap/:id", h.putRoadmap)
}

func (h *Handler) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) listRoadmaps(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"items": h.store.config.Entries()})
}

func (h *Handler) getRoadmap(c *gin.Context) {
	id := c.Param("id")
	content, err := h.store.ReadMarkdown(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	entry, _ := h.store.config.Find(id)
	c.JSON(http.StatusOK, gin.H{
		"id":      entry.ID,
		"title":   entry.Title,
		"content": content,
	})
}

type saveRequest struct {
	Content string `json:"content"`
}

func (h *Handler) putRoadmap(c *gin.Context) {
	id := c.Param("id")

	var req saveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求体格式无效"})
		return
	}
	if req.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content 不能为空"})
		return
	}

	if err := h.store.WriteMarkdown(id, req.Content); err != nil {
		status := http.StatusInternalServerError
		if _, findErr := h.store.config.Find(id); findErr != nil {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "保存成功"})
}

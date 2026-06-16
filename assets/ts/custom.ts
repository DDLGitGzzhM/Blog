interface TimelinePost {
    title: string;
    permalink: string;
    date: string;
    summary: string;
}

const DAYS_PER_BATCH = 3;
const MAX_DAYS_BACK = 366;
const SCROLL_LOAD_OFFSET = 240;

const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
};

const getDateForYear = (
    referenceDate: Date,
    year: number,
    daysBack: number
): Date => {
    const target = new Date(referenceDate);
    target.setFullYear(year);
    target.setDate(target.getDate() - daysBack);
    return target;
};

const buildPostsByDate = (
    posts: TimelinePost[]
): Map<string, TimelinePost[]> => {
    const map = new Map<string, TimelinePost[]>();
    posts.forEach((post) => {
        const existing = map.get(post.date) || [];
        existing.push(post);
        map.set(post.date, existing);
    });
    return map;
};

const createPostCard = (post: TimelinePost): HTMLElement => {
    const link = document.createElement("a");
    link.className = "time-line-post-card";
    link.href = post.permalink;

    const title = document.createElement("h3");
    title.className = "time-line-post-title";
    title.textContent = post.title;
    link.appendChild(title);

    if (post.summary) {
        const summary = document.createElement("p");
        summary.className = "time-line-post-summary";
        summary.textContent = post.summary;
        link.appendChild(summary);
    }

    return link;
};

const createDayNode = (
    date: Date,
    posts: TimelinePost[],
    referenceDateKey: string
): HTMLElement => {
    const node = document.createElement("div");
    node.className = "time-line-day-node";

    const dateKey = formatDateKey(date);
    if (dateKey === referenceDateKey) {
        node.classList.add("is-today");
    }

    const knot = document.createElement("div");
    knot.className = "time-line-day-knot";

    const label = document.createElement("div");
    label.className = "time-line-day-label";
    label.textContent = formatDisplayDate(date);

    knot.appendChild(label);
    node.appendChild(knot);

    const postsWrap = document.createElement("div");
    postsWrap.className = "time-line-day-posts";

    if (posts.length === 0) {
        const empty = document.createElement("div");
        empty.className = "time-line-empty-day";
        empty.textContent = "暂无内容";
        postsWrap.appendChild(empty);
    } else {
        posts.forEach((post) => postsWrap.appendChild(createPostCard(post)));
    }

    node.appendChild(postsWrap);
    return node;
};

class TimelineRope {
    readonly year: number;
    readonly referenceDate: Date;
    readonly referenceDateKey: string;
    readonly postsByDate: Map<string, TimelinePost[]>;
    readonly track: HTMLElement;
    readonly column: HTMLElement;
    daysLoaded = 0;

    constructor(
        year: number,
        calendarYear: number,
        referenceDate: Date,
        referenceDateKey: string,
        postsByDate: Map<string, TimelinePost[]>,
        grid: HTMLElement
    ) {
        this.year = year;
        this.referenceDate = referenceDate;
        this.referenceDateKey = referenceDateKey;
        this.postsByDate = postsByDate;

        this.column = document.createElement("div");
        this.column.className = "time-line-rope-column";
        if (year === calendarYear) {
            this.column.classList.add("is-current-year");
        }

        const yearLabel = document.createElement("div");
        yearLabel.className = "time-line-rope-year";
        yearLabel.textContent = String(year);
        this.column.appendChild(yearLabel);

        const trackWrap = document.createElement("div");
        trackWrap.className = "time-line-rope-track";

        const line = document.createElement("div");
        line.className = "time-line-rope-line";
        line.setAttribute("aria-hidden", "true");
        trackWrap.appendChild(line);

        this.track = document.createElement("div");
        this.track.className = "time-line-day-list";
        trackWrap.appendChild(this.track);

        this.column.appendChild(trackWrap);
        grid.appendChild(this.column);
    }

    loadNextBatch(): boolean {
        if (this.daysLoaded >= MAX_DAYS_BACK) {
            return false;
        }

        const start = this.daysLoaded;
        const end = Math.min(start + DAYS_PER_BATCH, MAX_DAYS_BACK);

        for (let daysBack = start; daysBack < end; daysBack++) {
            const date = getDateForYear(
                this.referenceDate,
                this.year,
                daysBack
            );
            const dateKey = formatDateKey(date);
            const posts = this.postsByDate.get(dateKey) || [];
            this.track.appendChild(
                createDayNode(date, posts, this.referenceDateKey)
            );
        }

        this.daysLoaded = end;
        return end < MAX_DAYS_BACK;
    }

    reset(): void {
        this.track.replaceChildren();
        this.daysLoaded = 0;
    }
}

class TimelineView {
    private readonly referenceDate: Date;
    private readonly referenceDateKey: string;
    private readonly calendarYear: number;
    private readonly postsByDate: Map<string, TimelinePost[]>;
    private readonly grid: HTMLElement;
    private readonly page: HTMLElement;
    private readonly endHint: HTMLElement | null;
    private readonly yearSelect: HTMLSelectElement;

    private ropes: TimelineRope[] = [];
    private anchorYear: number;
    private hasMore = true;
    private loading = false;
    private scrollReady = false;

    constructor(
        referenceDate: Date,
        calendarYear: number,
        postsByDate: Map<string, TimelinePost[]>,
        grid: HTMLElement,
        page: HTMLElement,
        yearSelect: HTMLSelectElement,
        endHint: HTMLElement | null
    ) {
        this.referenceDate = referenceDate;
        this.referenceDateKey = formatDateKey(referenceDate);
        this.calendarYear = calendarYear;
        this.postsByDate = postsByDate;
        this.grid = grid;
        this.page = page;
        this.yearSelect = yearSelect;
        this.endHint = endHint;
        this.anchorYear = Number(yearSelect.value);
    }

    init(): void {
        this.buildRopes();
        this.loadNextBatch(true);
        this.yearSelect.addEventListener("change", () => this.onYearChange());
        window.addEventListener("scroll", () => this.onScroll(), {
            passive: true,
        });
        window.setTimeout(() => {
            this.scrollReady = true;
        }, 300);
    }

    private getRopeYears(): number[] {
        return [
            this.anchorYear - 2,
            this.anchorYear - 1,
            this.anchorYear,
        ];
    }

    private buildRopes(): void {
        this.grid.replaceChildren();
        this.ropes = this.getRopeYears().map(
            (year) =>
                new TimelineRope(
                    year,
                    this.calendarYear,
                    this.referenceDate,
                    this.referenceDateKey,
                    this.postsByDate,
                    this.grid
                )
        );
    }

    private onYearChange(): void {
        this.anchorYear = Number(this.yearSelect.value);
        this.hasMore = true;
        this.loading = false;
        this.page.style.minHeight = "";
        if (this.endHint) {
            this.endHint.hidden = true;
        }
        this.buildRopes();
        this.loadNextBatch(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    private loadNextBatch(isInitial = false): void {
        if (!this.hasMore || this.loading) {
            return;
        }

        if (!isInitial && !this.scrollReady) {
            return;
        }

        this.loading = true;

        let anyRemaining = false;
        this.ropes.forEach((rope) => {
            if (rope.loadNextBatch()) {
                anyRemaining = true;
            }
        });

        this.hasMore = anyRemaining;
        if (!this.hasMore && this.endHint) {
            this.endHint.hidden = false;
        }

        this.ensureScrollRoom();
        this.loading = false;
    }

    private ensureScrollRoom(): void {
        if (!this.hasMore) {
            this.page.style.minHeight = "";
            return;
        }

        const pageBottom = document.documentElement.scrollHeight;
        if (pageBottom <= window.innerHeight + 80) {
            this.page.style.minHeight = `${window.innerHeight + 320}px`;
        }
    }

    private onScroll(): void {
        if (!this.hasMore || this.loading || window.scrollY < 20) {
            return;
        }

        const scrollBottom =
            window.scrollY + window.innerHeight + SCROLL_LOAD_OFFSET;
        const pageBottom = document.documentElement.scrollHeight;

        if (scrollBottom >= pageBottom) {
            this.loadNextBatch();
        }
    }
}

const parsePosts = (rawText: string): TimelinePost[] => {
    const raw = JSON.parse(rawText || "[]");
    return (Array.isArray(raw) ? raw : []).map((item) =>
        typeof item === "string" ? JSON.parse(item) : item
    );
};

const initTimeline = (): void => {
    const page = document.getElementById("time-line-page");
    const dataEl = document.getElementById("time-line-posts");
    const grid = document.getElementById("time-line-grid");
    const yearSelect = document.getElementById(
        "time-line-year"
    ) as HTMLSelectElement | null;
    const endHint = document.getElementById("time-line-end");

    if (!page || !dataEl || !grid || !yearSelect) {
        return;
    }

    const referenceDateStr = page.dataset.referenceDate;
    const calendarYearStr = page.dataset.currentYear;
    if (!referenceDateStr || !calendarYearStr) {
        return;
    }

    let posts: TimelinePost[] = [];
    try {
        posts = parsePosts(dataEl.textContent || "[]");
    } catch {
        console.error("Failed to parse timeline posts");
        return;
    }

    const view = new TimelineView(
        parseDate(referenceDateStr),
        Number(calendarYearStr),
        buildPostsByDate(posts),
        grid,
        page,
        yearSelect,
        endHint
    );
    view.init();
};

import { initRoadmap } from "./roadmap";

window.addEventListener("load", () => {
    initTimeline();
    initRoadmap();
});

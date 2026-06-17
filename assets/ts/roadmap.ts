interface RoadmapData {
    id: string;
    title: string;
    content: string;
}

interface RoadmapNode {
    id: string;
    title: string;
    level: number;
    children: RoadmapNode[];
    checkable: boolean;
}

interface MarkmapDataNode {
    content: string;
    children?: MarkmapDataNode[];
    payload?: { fold?: number; roadmapId?: string };
}

interface MarkmapInstance {
    setData: (data: unknown) => void;
    fit: () => void;
    toggleNode?: (data: unknown, recursive?: boolean) => Promise<void>;
    zoom?: {
        transform: (
            transition: unknown,
            transform: unknown
        ) => void;
    };
}

interface D3ZoomTransform {
    x: number;
    y: number;
    k: number;
}

interface D3Selection {
    call: (
        fn: { transform: (transition: unknown, transform: unknown) => void },
        transform: unknown
    ) => void;
    on: (typenames: string, listener: (() => void) | null) => void;
}

interface MarkmapGlobal {
    Markmap: {
        create: (
            svg: SVGSVGElement,
            options?: Record<string, unknown>,
            data?: unknown
        ) => MarkmapInstance;
    };
    deriveOptions: (json: Record<string, unknown>) => Record<string, unknown>;
    loadCSS: (css: string) => void;
    loadJS: (
        items: Array<string | { type: string; data: { src: string } }>,
        options?: { getMarkmap: () => unknown }
    ) => Promise<unknown>;
    Transformer: new () => {
        transform: (content: string) => { root: unknown };
        getAssets: () => {
            styles?: string[];
            scripts?: Array<string | { type: string; data: { src: string } }>;
        };
    };
}

interface JSZipGlobal {
    new (): {
        file: (name: string, content: string) => void;
        generateAsync: (options: { type: string }) => Promise<Blob>;
    };
}

declare const window: Window & {
    markmap: MarkmapGlobal;
    JSZip: JSZipGlobal;
    d3?: {
        zoomTransform: (node: Element) => D3ZoomTransform;
        zoomIdentity: {
            translate: (x: number, y: number) => D3ZoomTransform;
            scale: (k: number) => D3ZoomTransform;
        };
        select: (el: Element) => D3Selection;
    };
};

const STORAGE_PREFIX = "blog-roadmap-progress:";
const VIEW_STORAGE_PREFIX = "blog-roadmap-view:";

interface SavedView {
    x: number;
    y: number;
    k: number;
}
const CHECKED_PREFIX = "✅ ";
const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const TASK_RE = /^[-*+]\s+\[([ xX])\]\s+(.+)$/;
const LIST_RE = /^[-*+]\s+(.+)$/;

const slugify = (value: string): string =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, "-")
        .replace(/^-+|-+$/g, "");

const parseRoadmaps = (rawText: string): RoadmapData[] => {
    const raw = JSON.parse(rawText || "[]");
    return (Array.isArray(raw) ? raw : []).map((item) =>
        typeof item === "string" ? JSON.parse(item) : item
    );
};

const stripCheckbox = (line: string): string => {
    const taskMatch = line.match(TASK_RE);
    if (taskMatch) {
        return taskMatch[2].trim();
    }
    const listMatch = line.match(LIST_RE);
    if (listMatch) {
        return listMatch[1].trim();
    }
    return line.trim();
};

const parseMarkdownTree = (markdown: string): RoadmapNode[] => {
    const root: RoadmapNode = {
        id: "root",
        title: "root",
        level: 0,
        children: [],
        checkable: false,
    };
    const stack: RoadmapNode[] = [root];
    const idCounts = new Map<string, number>();

    const makeId = (title: string, parentId: string): string => {
        const base = `${parentId}/${slugify(title) || "node"}`;
        const count = idCounts.get(base) || 0;
        idCounts.set(base, count + 1);
        return count === 0 ? base : `${base}-${count}`;
    };

    markdown.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "---") {
            return;
        }
        if (trimmed.startsWith(">")) {
            return;
        }

        const headingMatch = trimmed.match(HEADING_RE);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const title = headingMatch[2].replace(CHECKED_PREFIX, "").trim();
            const node: RoadmapNode = {
                id: "",
                title,
                level,
                children: [],
                checkable: level > 1,
            };

            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            const parent = stack[stack.length - 1];
            node.id = makeId(title, parent.id);
            parent.children.push(node);
            stack.push(node);
            return;
        }

        const taskMatch = trimmed.match(TASK_RE);
        const listMatch = trimmed.match(LIST_RE);
        if (!taskMatch && !listMatch) {
            return;
        }

        const title = stripCheckbox(trimmed).replace(CHECKED_PREFIX, "").trim();
        const parent = stack[stack.length - 1];
        const node: RoadmapNode = {
            id: makeId(title, parent.id),
            title,
            level: parent.level + 1,
            children: [],
            checkable: true,
        };
        parent.children.push(node);
    });

    return root.children;
};

const collectCheckableNodes = (nodes: RoadmapNode[]): RoadmapNode[] => {
    const result: RoadmapNode[] = [];
    const walk = (items: RoadmapNode[]): void => {
        items.forEach((node) => {
            if (node.checkable) {
                result.push(node);
            }
            walk(node.children);
        });
    };
    walk(nodes);
    return result;
};

const findNodeById = (
    nodes: RoadmapNode[],
    nodeId: string
): RoadmapNode | undefined => {
    for (const node of nodes) {
        if (node.id === nodeId) {
            return node;
        }
        const found = findNodeById(node.children, nodeId);
        if (found) {
            return found;
        }
    }
    return undefined;
};

const collectDescendantCheckableIds = (node: RoadmapNode): string[] => {
    const ids: string[] = [];
    const walk = (items: RoadmapNode[]): void => {
        items.forEach((item) => {
            if (item.checkable) {
                ids.push(item.id);
            }
            walk(item.children);
        });
    };
    walk(node.children);
    return ids;
};

const normalizeNodeTitle = (value: string): string => {
    let text = value;
    if (text.includes("&")) {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = text;
        text = textarea.value;
    }
    return text
        .replace(CHECKED_PREFIX, "")
        .replace(/<[^>]+>/g, "")
        .trim();
};

const bindRoadmapIds = (
    markmapNode: MarkmapDataNode,
    roadmapNode: RoadmapNode | null
): void => {
    if (roadmapNode) {
        markmapNode.payload = {
            ...(markmapNode.payload || {}),
            roadmapId: roadmapNode.id,
        };
    }

    const markmapChildren = markmapNode.children || [];
    const roadmapChildren = roadmapNode?.children || [];

    markmapChildren.forEach((markmapChild, index) => {
        const markmapTitle = normalizeNodeTitle(markmapChild.content);
        let roadmapChild = roadmapChildren[index] ?? null;
        if (
            !roadmapChild ||
            normalizeNodeTitle(roadmapChild.title) !== markmapTitle
        ) {
            roadmapChild =
                roadmapChildren.find(
                    (child) =>
                        normalizeNodeTitle(child.title) === markmapTitle
                ) ?? null;
        }
        bindRoadmapIds(markmapChild, roadmapChild);
    });
};

const getStorageKey = (roadmapId: string): string =>
    `${STORAGE_PREFIX}${roadmapId}`;

const loadCheckedSet = (roadmapId: string): Set<string> => {
    try {
        const raw = localStorage.getItem(getStorageKey(roadmapId));
        if (!raw) {
            return new Set();
        }
        const parsed = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
        return new Set();
    }
};

const saveCheckedSet = (roadmapId: string, checked: Set<string>): void => {
    localStorage.setItem(
        getStorageKey(roadmapId),
        JSON.stringify(Array.from(checked))
    );
};

const getViewStorageKey = (roadmapId: string): string =>
    `${VIEW_STORAGE_PREFIX}${roadmapId}`;

const loadSavedView = (roadmapId: string): SavedView | null => {
    try {
        const raw = localStorage.getItem(getViewStorageKey(roadmapId));
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as SavedView;
        if (
            typeof parsed.x !== "number" ||
            typeof parsed.y !== "number" ||
            typeof parsed.k !== "number"
        ) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

const saveSavedView = (roadmapId: string, view: SavedView): void => {
    localStorage.setItem(getViewStorageKey(roadmapId), JSON.stringify(view));
};

const applyCheckedToMarkdown = (
    markdown: string,
    checked: Set<string>,
    nodes: RoadmapNode[]
): string => {
    const titleToId = new Map<string, string>();
    const walk = (items: RoadmapNode[]): void => {
        items.forEach((node) => {
            titleToId.set(node.title, node.id);
            walk(node.children);
        });
    };
    walk(nodes);

    return markdown
        .split("\n")
        .map((line) => {
            const trimmed = line.trim();
            const headingMatch = trimmed.match(HEADING_RE);
            if (headingMatch) {
                const title = headingMatch[2].replace(CHECKED_PREFIX, "").trim();
                const id = titleToId.get(title);
                if (id && checked.has(id)) {
                    const marks = headingMatch[1];
                    return `${marks} ${CHECKED_PREFIX}${title}`;
                }
                return line;
            }

            const taskMatch = trimmed.match(TASK_RE);
            if (taskMatch) {
                const title = taskMatch[2].replace(CHECKED_PREFIX, "").trim();
                const id = titleToId.get(title);
                const isChecked = id
                    ? checked.has(id)
                    : taskMatch[1].toLowerCase() === "x";
                const indent = line.slice(0, line.indexOf("-"));
                return `${indent}- [${isChecked ? "x" : " "}] ${title}`;
            }

            const listMatch = trimmed.match(LIST_RE);
            if (listMatch) {
                const title = listMatch[1].replace(CHECKED_PREFIX, "").trim();
                const id = titleToId.get(title);
                if (id && checked.has(id)) {
                    const indent = line.slice(0, line.indexOf("-"));
                    return `${indent}- ${CHECKED_PREFIX}${title}`;
                }
            }

            return line;
        })
        .join("\n");
};

const countProgress = (
    nodes: RoadmapNode[],
    checked: Set<string>
): { done: number; total: number } => {
    const checkable = collectCheckableNodes(nodes);
    const done = checkable.filter((node) => checked.has(node.id)).length;
    return { done, total: checkable.length };
};

const createXMindTopic = (
    node: RoadmapNode,
    checked: Set<string>
): Record<string, unknown> => {
    const title = checked.has(node.id)
        ? `${CHECKED_PREFIX}${node.title}`
        : node.title;
    const children = node.children.map((child) =>
        createXMindTopic(child, checked)
    );
    const topic: Record<string, unknown> = {
        id: node.id.replace(/[^\w-]/g, "_"),
        title,
    };
    if (children.length > 0) {
        topic.children = { attached: children };
    }
    return topic;
};

const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
};

class RoadmapView {
    private readonly roadmaps: RoadmapData[];
    private readonly select: HTMLSelectElement;
    private readonly progressWrap: HTMLElement;
    private readonly progressFill: HTMLElement;
    private readonly progressText: HTMLElement;
    private readonly mindmapSvg: SVGSVGElement;
    private readonly mindmapToolbar: HTMLElement;
    private readonly exportBtn: HTMLButtonElement;

    private currentId = "";
    private currentNodes: RoadmapNode[] = [];
    private checked = new Set<string>();
    private nodeElements = new Map<string, SVGGElement>();
    private documentRootDom: SVGGElement | null = null;
    private markmapInstance: MarkmapInstance | null = null;
    private transformer: InstanceType<MarkmapGlobal["Transformer"]> | null = null;
    private assetsLoaded = false;
    private lastRenderedRoadmapId = "";
    private viewPersistenceReady = false;
    private viewPersistTimer = 0;
    private loadGeneration = 0;

    constructor(
        roadmaps: RoadmapData[],
        select: HTMLSelectElement,
        progressWrap: HTMLElement,
        progressFill: HTMLElement,
        progressText: HTMLElement,
        mindmapSvg: SVGSVGElement,
        mindmapToolbar: HTMLElement,
        exportBtn: HTMLButtonElement
    ) {
        this.roadmaps = roadmaps;
        this.select = select;
        this.progressWrap = progressWrap;
        this.progressFill = progressFill;
        this.progressText = progressText;
        this.mindmapSvg = mindmapSvg;
        this.mindmapToolbar = mindmapToolbar;
        this.exportBtn = exportBtn;
    }

    init(): void {
        if (this.roadmaps.length === 0) {
            this.mindmapToolbar.textContent = "暂无路线图数据";
            return;
        }

        this.currentId = this.select.value || this.roadmaps[0].id;
        this.renderToolbar();
        this.bindEvents();
        window.addEventListener("pagehide", () => this.persistCurrentView());
        void this.loadRoadmap(this.currentId);
    }

    private bindEvents(): void {
        this.select.addEventListener("change", () => {
            void this.loadRoadmap(this.select.value);
        });
        this.exportBtn.addEventListener("click", () => void this.exportXMind());
    }

    private getCurrentRoadmap(): RoadmapData | undefined {
        return this.roadmaps.find((item) => item.id === this.currentId);
    }

    private renderToolbar(): void {
        this.mindmapToolbar.replaceChildren();

        const fitBtn = document.createElement("button");
        fitBtn.type = "button";
        fitBtn.className = "roadmap-toolbar-btn";
        fitBtn.textContent = "适配视图";
        fitBtn.addEventListener("click", () => {
            this.markmapInstance?.fit();
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    this.persistCurrentView();
                });
            });
        });

        this.mindmapToolbar.append(fitBtn);
    }

    private resetMarkmapInstance(): void {
        this.mindmapSvg.replaceChildren();
        this.markmapInstance = null;
        this.documentRootDom = null;
        this.nodeElements.clear();
    }

    private patchMarkmapInstance(): void {
        const markmap = this.markmapInstance as MarkmapInstance & {
            _roadmapPatched?: boolean;
        };
        if (!markmap?.toggleNode || markmap._roadmapPatched) {
            return;
        }

        const originalToggle = markmap.toggleNode.bind(markmap);
        markmap.toggleNode = async (data, recursive) => {
            await originalToggle(data, recursive);
            this.attachMindmapInteractions();
        };
        markmap._roadmapPatched = true;
    }

    private async ensureMarkmapAssets(): Promise<void> {
        if (!window.markmap) {
            console.error("Markmap runtime is not loaded");
            return;
        }
        if (this.assetsLoaded) {
            return;
        }

        const { Transformer, loadJS, loadCSS } = window.markmap;
        this.transformer = new Transformer();
        const { styles, scripts } = this.transformer.getAssets();
        if (styles) {
            loadCSS(styles);
        }
        if (scripts) {
            await loadJS(scripts, {
                getMarkmap: () => window.markmap,
            });
        }
        this.assetsLoaded = true;
    }

    private isRenderStale(generation: number, roadmapId: string): boolean {
        return (
            generation !== this.loadGeneration || roadmapId !== this.currentId
        );
    }

    private async renderMindmap(
        markdown: string,
        afterRender?: () => void,
        generation = this.loadGeneration,
        roadmapId = this.currentId
    ): Promise<void> {
        await this.ensureMarkmapAssets();
        if (this.isRenderStale(generation, roadmapId)) {
            return;
        }
        if (!this.transformer || !window.markmap) {
            return;
        }

        const markmapRoot = this.prepareMarkmapRoot(markdown);
        if (!markmapRoot || this.isRenderStale(generation, roadmapId)) {
            return;
        }
        await this.renderMindmapData(
            markmapRoot,
            afterRender,
            generation,
            roadmapId
        );
    }

    private prepareMarkmapRoot(markdown: string): MarkmapDataNode | null {
        if (!this.transformer) {
            return null;
        }
        const { root } = this.transformer.transform(markdown);
        const markmapRoot = root as MarkmapDataNode;
        bindRoadmapIds(markmapRoot, this.currentNodes[0] ?? null);
        return markmapRoot;
    }

    private async renderMindmapData(
        root: unknown,
        afterRender?: () => void,
        generation = this.loadGeneration,
        roadmapId = this.currentId
    ): Promise<void> {
        if (!window.markmap || this.isRenderStale(generation, roadmapId)) {
            return;
        }

        const isRoadmapSwitch =
            this.lastRenderedRoadmapId !== "" &&
            this.lastRenderedRoadmapId !== roadmapId;
        const liveView =
            !isRoadmapSwitch &&
            this.markmapInstance &&
            this.lastRenderedRoadmapId === roadmapId
                ? this.readZoomTransform()
                : null;
        const savedView = isRoadmapSwitch ? null : loadSavedView(roadmapId);
        const viewToRestore = liveView ?? savedView;
        const shouldFit = viewToRestore === null;

        const markmapOptions = {
            ...window.markmap.deriveOptions({
                initialExpandLevel: -1,
            }),
            autoFit: false,
        };

        if (!this.markmapInstance) {
            this.markmapInstance = window.markmap.Markmap.create(
                this.mindmapSvg,
                markmapOptions,
                root
            );
            this.ensureViewPersistence();
            this.patchMarkmapInstance();
        } else if (this.lastRenderedRoadmapId === roadmapId) {
            this.markmapInstance.setData(root);
        } else {
            this.resetMarkmapInstance();
            this.markmapInstance = window.markmap.Markmap.create(
                this.mindmapSvg,
                markmapOptions,
                root
            );
            this.ensureViewPersistence();
            this.patchMarkmapInstance();
        }

        const finishRender = (): void => {
            if (this.isRenderStale(generation, roadmapId)) {
                return;
            }
            if (viewToRestore) {
                this.applySavedView(viewToRestore);
            }
            this.lastRenderedRoadmapId = roadmapId;
            this.attachMindmapInteractions();
            afterRender?.();
        };

        if (!shouldFit) {
            window.requestAnimationFrame(() => {
                window.setTimeout(finishRender, 80);
            });
            return;
        }

        window.requestAnimationFrame(() => {
            if (this.isRenderStale(generation, roadmapId)) {
                return;
            }
            this.markmapInstance?.fit();
            window.requestAnimationFrame(() => {
                if (this.isRenderStale(generation, roadmapId)) {
                    return;
                }
                this.markmapInstance?.fit();
                window.setTimeout(finishRender, 80);
            });
        });
    }

    private readZoomTransform(): SavedView | null {
        if (window.d3) {
            try {
                const transform = window.d3.zoomTransform(this.mindmapSvg);
                return {
                    x: transform.x,
                    y: transform.y,
                    k: transform.k,
                };
            } catch {
                return this.readTransformFromSVGElement();
            }
        }
        return this.readTransformFromSVGElement();
    }

    private readTransformFromSVGElement(): SavedView | null {
        const innerG = this.mindmapSvg.querySelector(":scope > g");
        const attr = innerG?.getAttribute("transform");
        if (!attr) {
            return null;
        }

        const translateMatch = attr.match(
            /translate\(\s*([-\d.]+)[ ,]\s*([-\d.]+)\s*\)/
        );
        const scaleMatch = attr.match(/scale\(\s*([-\d.]+)\s*\)/);
        if (!translateMatch) {
            return null;
        }

        return {
            x: Number.parseFloat(translateMatch[1]),
            y: Number.parseFloat(translateMatch[2]),
            k: scaleMatch ? Number.parseFloat(scaleMatch[1]) : 1,
        };
    }

    private applySavedView(view: SavedView): void {
        const markmap = this.markmapInstance;
        if (markmap?.zoom && window.d3) {
            const transform = window.d3.zoomIdentity
                .translate(view.x, view.y)
                .scale(view.k);
            try {
                window.d3
                    .select(this.mindmapSvg)
                    .call(markmap.zoom.transform, transform);
                return;
            } catch {
                // fall through to attribute fallback
            }
        }

        const innerG = this.mindmapSvg.querySelector(":scope > g");
        if (!innerG) {
            return;
        }
        innerG.setAttribute(
            "transform",
            `translate(${view.x},${view.y}) scale(${view.k})`
        );
    }

    private persistCurrentView(): void {
        if (!this.currentId || !this.markmapInstance) {
            return;
        }
        const view = this.readZoomTransform();
        if (!view) {
            return;
        }
        saveSavedView(this.currentId, view);
    }

    private ensureViewPersistence(): void {
        if (this.viewPersistenceReady || !window.d3) {
            return;
        }
        this.viewPersistenceReady = true;
        window.d3.select(this.mindmapSvg).on("zoom.roadmap-view", () => {
            window.clearTimeout(this.viewPersistTimer);
            this.viewPersistTimer = window.setTimeout(() => {
                this.persistCurrentView();
            }, 200);
        });
    }

    private getTextForeignObject(node: SVGGElement): Element | null {
        return node.querySelector("foreignObject.markmap-foreign");
    }

    private getContentDiv(foreignObject: Element): HTMLDivElement | null {
        const outer = foreignObject.querySelector(":scope > div");
        if (!outer) {
            return null;
        }
        return outer.querySelector(":scope > div");
    }

    private removeNodeCheckbox(element: SVGGElement): void {
        element
            .querySelectorAll(".roadmap-checkbox-inline")
            .forEach((node) => node.remove());
        element
            .querySelector(".roadmap-node-content-wrap")
            ?.classList.remove("roadmap-node-content-wrap");
    }

    private getNodeText(element: SVGGElement): string {
        const textFo = this.getTextForeignObject(element);
        const contentDiv = textFo ? this.getContentDiv(textFo) : null;
        if (!contentDiv) {
            return "";
        }
        const clone = contentDiv.cloneNode(true) as HTMLDivElement;
        clone.querySelector(".roadmap-checkbox-inline")?.remove();
        return normalizeNodeTitle(clone.textContent?.trim() || "");
    }

    private getDocumentRoot(): RoadmapNode | undefined {
        return this.currentNodes[0];
    }

    private getNodeDisplayText(element: SVGGElement): string {
        const fromDom = this.getNodeText(element);
        if (fromDom) {
            return fromDom;
        }

        const datum = (element as SVGGElement & { __data__?: MarkmapDataNode })
            .__data__;
        if (datum?.content) {
            return normalizeNodeTitle(datum.content);
        }
        return "";
    }

    private findDocumentRootDom(): SVGGElement | undefined {
        if (this.documentRootDom?.isConnected) {
            return this.documentRootDom;
        }

        const root = this.getDocumentRoot();
        if (!root) {
            return undefined;
        }

        const normalized = normalizeNodeTitle(root.title);
        const allDomNodes = this.mindmapSvg.querySelectorAll<SVGGElement>(
            "g.markmap-node"
        );
        for (const element of allDomNodes) {
            if (this.getNodeDisplayText(element) === normalized) {
                this.documentRootDom = element;
                return element;
            }
        }

        return undefined;
    }

    private isRootDomNode(element: SVGGElement): boolean {
        const rootElement = this.findDocumentRootDom();
        return rootElement === element;
    }

    private getContentDomNodes(domNodes: SVGGElement[]): SVGGElement[] {
        const rootElement = this.findDocumentRootDom();
        if (!rootElement) {
            return domNodes;
        }
        return domNodes.filter((element) => element !== rootElement);
    }

    private markDocumentRootDom(): void {
        const rootElement = this.findDocumentRootDom();
        if (!rootElement) {
            return;
        }
        rootElement.classList.add("roadmap-document-root");
        this.removeNodeCheckbox(rootElement);
    }

    private bindDomNode(element: SVGGElement, node: RoadmapNode): void {
        if (this.isRootDomNode(element)) {
            return;
        }
        this.nodeElements.set(node.id, element);
        element.dataset.roadmapId = node.id;

        const isChecked = this.checked.has(node.id);
        element.classList.toggle("is-done", isChecked);
        this.renderNodeCheckbox(element, node.id, isChecked);
    }

    private bindDomNodesByTitle(
        domNodes: SVGGElement[],
        roadmapNodes: RoadmapNode[]
    ): void {
        const titleCounts = new Map<string, number>();
        domNodes.forEach((element) => {
            if (this.isRootDomNode(element)) {
                return;
            }

            const text = this.getNodeDisplayText(element);
            if (!text) {
                return;
            }

            const seen = titleCounts.get(text) || 0;
            let count = 0;
            let matched: RoadmapNode | undefined;
            for (const item of roadmapNodes) {
                if (normalizeNodeTitle(item.title) !== text) {
                    continue;
                }
                if (count === seen) {
                    matched = item;
                    break;
                }
                count += 1;
            }
            titleCounts.set(text, seen + 1);

            if (matched) {
                this.bindDomNode(element, matched);
            }
        });
    }

    private attachMindmapInteractions(): void {
        this.nodeElements.clear();
        this.documentRootDom = null;

        const allDomNodes = Array.from(
            this.mindmapSvg.querySelectorAll<SVGGElement>("g.markmap-node")
        );
        this.markDocumentRootDom();

        const roadmapNodes = collectCheckableNodes(this.currentNodes);
        const domNodes = this.getContentDomNodes(allDomNodes);
        this.bindDomNodesByTitle(domNodes, roadmapNodes);
    }

    private renderNodeCheckbox(
        element: SVGGElement,
        nodeId: string,
        isChecked: boolean
    ): void {
        const xhtmlNS = "http://www.w3.org/1999/xhtml";
        this.removeNodeCheckbox(element);

        const textFo = this.getTextForeignObject(element);
        const contentDiv = textFo ? this.getContentDiv(textFo) : null;
        if (!textFo || !contentDiv) {
            return;
        }

        const wrapper = document.createElementNS(xhtmlNS, "span");
        wrapper.className = "roadmap-checkbox-inline";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "roadmap-checkbox-input";
        input.checked = isChecked;
        input.setAttribute("aria-label", "标记完成");

        wrapper.appendChild(input);
        contentDiv.insertBefore(wrapper, contentDiv.firstChild);

        input.addEventListener("click", (event) => {
            event.stopPropagation();
            this.setChecked(nodeId, input.checked, false);
        });
    }

    private getAffectedNodeIds(nodeId: string): string[] {
        const node = findNodeById(this.currentNodes, nodeId);
        if (!node) {
            return [nodeId];
        }
        return [nodeId, ...collectDescendantCheckableIds(node)];
    }

    private updateNodeCheckedDom(nodeId: string, isChecked: boolean): void {
        const element = this.nodeElements.get(nodeId);
        if (!element) {
            return;
        }
        element.classList.toggle("is-done", isChecked);
        const input = element.querySelector<HTMLInputElement>(
            ".roadmap-checkbox-input"
        );
        if (input) {
            input.checked = isChecked;
        } else {
            this.renderNodeCheckbox(element, nodeId, isChecked);
        }
    }

    private setChecked(
        nodeId: string,
        isChecked: boolean,
        rerender = true
    ): void {
        const affectedIds = this.getAffectedNodeIds(nodeId);
        affectedIds.forEach((id) => {
            if (isChecked) {
                this.checked.add(id);
            } else {
                this.checked.delete(id);
            }
        });
        saveCheckedSet(this.currentId, this.checked);
        this.updateProgress();
        affectedIds.forEach((id) => {
            this.updateNodeCheckedDom(id, isChecked);
        });

        if (!rerender) {
            return;
        }

        const roadmap = this.getCurrentRoadmap();
        if (roadmap) {
            const markdown = applyCheckedToMarkdown(
                roadmap.content,
                this.checked,
                this.currentNodes
            );
            void this.renderMindmap(markdown);
        }
    }

    private updateProgress(): void {
        const { done, total } = countProgress(this.currentNodes, this.checked);
        const percent = total === 0 ? 0 : Math.round((done / total) * 100);
        this.progressWrap.hidden = total === 0;
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = `${percent}%（${done}/${total}）`;
    }

    private async loadRoadmap(roadmapId: string): Promise<void> {
        const roadmap = this.roadmaps.find((item) => item.id === roadmapId);
        if (!roadmap) {
            return;
        }

        const generation = ++this.loadGeneration;
        if (
            this.lastRenderedRoadmapId &&
            this.lastRenderedRoadmapId !== roadmapId
        ) {
            this.resetMarkmapInstance();
        }

        this.currentId = roadmapId;
        this.currentNodes = parseMarkdownTree(roadmap.content);
        this.checked = loadCheckedSet(roadmapId);

        const documentRoot = this.currentNodes[0];
        if (documentRoot && this.checked.delete(documentRoot.id)) {
            saveCheckedSet(roadmapId, this.checked);
        }

        this.updateProgress();

        const markdown = applyCheckedToMarkdown(
            roadmap.content,
            this.checked,
            this.currentNodes
        );
        await this.renderMindmap(markdown, undefined, generation, roadmapId);
    }

    private async exportXMind(): Promise<void> {
        const roadmap = this.getCurrentRoadmap();
        if (!roadmap || !window.JSZip) {
            return;
        }

        const rootTopic = {
            id: "root",
            title: roadmap.title,
            children: {
                attached: this.currentNodes.map((node) =>
                    createXMindTopic(node, this.checked)
                ),
            },
        };

        const content = [
            {
                id: `${roadmap.id}-sheet`,
                class: "sheet",
                title: "Sheet 1",
                rootTopic,
            },
        ];

        const zip = new window.JSZip();
        zip.file("content.json", JSON.stringify(content));
        zip.file("metadata.json", JSON.stringify({}));
        zip.file(
            "manifest.json",
            JSON.stringify({
                "file-entries": {
                    "content.json": {},
                    "metadata.json": {},
                },
            })
        );

        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, `${roadmap.id}.xmind`);
    }
}

export const initRoadmap = (): void => {
    const dataEl = document.getElementById("roadmap-data");
    const select = document.getElementById(
        "roadmap-select"
    ) as HTMLSelectElement | null;
    const progressWrap = document.getElementById("roadmap-progress-wrap");
    const progressFill = document.getElementById("roadmap-progress-fill");
    const progressText = document.getElementById("roadmap-progress-text");
    const mindmapSvg = document.getElementById(
        "roadmap-mindmap-svg"
    ) as SVGSVGElement | null;
    const mindmapToolbar = document.getElementById("roadmap-mindmap-toolbar");
    const exportBtn = document.getElementById(
        "roadmap-export-xmind"
    ) as HTMLButtonElement | null;

    if (
        !dataEl ||
        !select ||
        !progressWrap ||
        !progressFill ||
        !progressText ||
        !mindmapSvg ||
        !mindmapToolbar ||
        !exportBtn
    ) {
        return;
    }

    let roadmaps: RoadmapData[] = [];
    try {
        roadmaps = parseRoadmaps(dataEl.textContent || "[]");
    } catch {
        console.error("Failed to parse roadmap data");
        return;
    }

    const view = new RoadmapView(
        roadmaps,
        select,
        progressWrap,
        progressFill,
        progressText,
        mindmapSvg,
        mindmapToolbar,
        exportBtn
    );
    view.init();
};

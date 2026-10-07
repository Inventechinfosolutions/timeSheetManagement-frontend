/** Standard A4 (ISO 216) for the note preview sheets. */
const A4_PORTRAIT_WIDTH_MM = 210;
const A4_PORTRAIT_HEIGHT_MM = 297;
const A4_LANDSCAPE_WIDTH_MM = 297;
const A4_LANDSCAPE_HEIGHT_MM = 210;
const DEFAULT_PAGE_WIDTH_PT = 595;
const DEFAULT_PAGE_HEIGHT_PT = 842;

export const isLandscapeRotation = (rotation?: number) =>
  rotation === 90 || rotation === 270;

/** Portrait = isVertical true; Landscape = isVertical false (or legacy rotation 90/270). */
export const isNoteLandscape = (note?: {
  isVertical?: boolean;
  rotation?: number;
} | null) => {
  if (!note) return false;
  if (note.isVertical === false) return true;
  if (note.isVertical === true) return false;
  return isLandscapeRotation(note.rotation);
};

export const orientationFromLandscape = (landscape: boolean) => ({
  isVertical: !landscape,
  rotation: landscape ? 90 : 0,
});

export const orientPageSize = (
  _width: number,
  _height: number,
  landscape: boolean
): { widthMm: number; heightMm: number } =>
  landscape
    ? { widthMm: A4_LANDSCAPE_WIDTH_MM, heightMm: A4_LANDSCAPE_HEIGHT_MM }
    : { widthMm: A4_PORTRAIT_WIDTH_MM, heightMm: A4_PORTRAIT_HEIGHT_MM };

export interface ExtractedPageSize {
  width?: number;
  height?: number;
}

export interface ExtractedPage {
  size?: ExtractedPageSize;
  page_no?: number;
}

export interface ExtractedRenderPage {
  page_no?: number;
  width_pt?: number;
  height_pt?: number;
  html?: string;
}

type DoclingDocument = {
  schema_name?: string;
  pages?: Record<string, ExtractedPage>;
  texts?: any[];
  tables?: any[];
  pictures?: any[];
};

const MM_TO_PX = 96 / 25.4;

const pageStyle = (landscape: boolean) => {
  const width = landscape ? A4_LANDSCAPE_WIDTH_MM : A4_PORTRAIT_WIDTH_MM;
  const minHeight = landscape ? A4_LANDSCAPE_HEIGHT_MM : A4_PORTRAIT_HEIGHT_MM;
  return `width:${width}mm;min-width:${width}mm;max-width:${width}mm;min-height:${minHeight}mm;height:auto;max-height:none`;
};

const a4SheetHeightPx = (landscape: boolean) =>
  (landscape ? A4_LANDSCAPE_HEIGHT_MM : A4_PORTRAIT_HEIGHT_MM) * MM_TO_PX;

const createSheet = (pageNo: number, landscape: boolean) => {
  const page = document.createElement("div");
  page.className = `page${landscape ? " is-landscape" : ""}`;
  page.setAttribute("data-page", String(pageNo));
  page.setAttribute("style", pageStyle(landscape));
  return page;
};

const applySheetBox = (el: HTMLElement, landscape: boolean, pageNo?: number) => {
  const size = orientPageSize(0, 0, landscape);
  el.style.width = `${size.widthMm}mm`;
  el.style.minWidth = `${size.widthMm}mm`;
  el.style.maxWidth = `${size.widthMm}mm`;
  el.style.height = "auto";
  el.style.minHeight = `${size.heightMm}mm`;
  el.style.maxHeight = "none";
  el.classList.toggle("is-landscape", landscape);
  if (pageNo) el.setAttribute("data-page", String(pageNo));
};

const pageLimitY = (page: HTMLElement, landscape: boolean) =>
  page.getBoundingClientRect().top + a4SheetHeightPx(landscape);

/** Empty / break-only blocks from Enter — must stay on the current page, not open a new sheet */
const isTrivialOverflowNode = (el: HTMLElement): boolean => {
  if (el.tagName === "TABLE") return false;
  if (el.querySelector("img, table, video, canvas, svg, iframe")) return false;
  const text = (el.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  return text.length === 0;
};

/** Keep typed content inside .page sheets (Enter must not create orphans outside the page). */
export const absorbOrphansIntoPages = (root: HTMLElement, landscape: boolean) => {
  let pages = Array.from(root.querySelectorAll(":scope > .page")) as HTMLElement[];
  if (pages.length === 0) {
    const sheet = createSheet(1, landscape);
    while (root.firstChild) sheet.appendChild(root.firstChild);
    root.appendChild(sheet);
    return;
  }

  const orphans = Array.from(root.childNodes).filter((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return !(node as HTMLElement).classList.contains("page");
    }
    // Loose text nodes outside pages
    return node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim().length > 0;
  });

  if (orphans.length === 0) return;

  const target = pages[pages.length - 1];
  orphans.forEach((node) => {
    target.appendChild(node);
  });
};

const splitTableAcrossPage = (
  table: HTMLTableElement,
  page: HTMLElement,
  landscape: boolean
): HTMLTableElement | null => {
  const limitY = pageLimitY(page, landscape);
  const rows = Array.from(table.querySelectorAll("tr"));
  const overflowStart = rows.findIndex((row) => {
    if (row.closest("thead")) return false;
    return row.getBoundingClientRect().bottom > limitY + 1;
  });
  if (overflowStart <= 0) return null;

  const overflowRows = rows.slice(overflowStart).filter((row) => !row.closest("thead"));
  if (overflowRows.length === 0) return null;

  const clone = table.cloneNode(false) as HTMLTableElement;
  table.querySelectorAll("colgroup").forEach((colgroup) => {
    clone.appendChild(colgroup.cloneNode(true));
  });
  const sourceHead = table.querySelector("thead");
  if (sourceHead) clone.appendChild(sourceHead.cloneNode(true));
  const sourceBody = table.querySelector("tbody");
  const cloneBody = document.createElement(sourceBody ? "tbody" : "tbody");
  overflowRows.forEach((row) => cloneBody.appendChild(row));
  clone.appendChild(cloneBody);
  return clone;
};

const pushOverflowToNextPage = (page: HTMLElement, landscape: boolean): HTMLElement | null => {
  // Use real content height, not min-height (empty Enter lines must not open a new sheet)
  const contentHeight = Math.max(
    page.scrollHeight,
    ...Array.from(page.children).map((c) => {
      const el = c as HTMLElement;
      return el.offsetTop + el.offsetHeight;
    }),
    0
  );
  if (contentHeight <= a4SheetHeightPx(landscape) + 8) return null;

  const limitY = pageLimitY(page, landscape);
  const children = Array.from(page.children) as HTMLElement[];
  const overflowChild = children.find(
    (child) => child.getBoundingClientRect().bottom > limitY + 1
  );
  if (!overflowChild) return null;

  // Enter / blank lines past the fold stay on this page — only real content starts a new sheet
  if (isTrivialOverflowNode(overflowChild)) return null;

  const isFirst = overflowChild === children[0];
  if (overflowChild.tagName === "TABLE") {
    const leftover = splitTableAcrossPage(overflowChild as HTMLTableElement, page, landscape);
    if (leftover) {
      const next = createSheet(0, landscape);
      next.appendChild(leftover);
      const startIndex = children.indexOf(overflowChild);
      children.slice(startIndex + 1).forEach((child) => next.appendChild(child));
      return next;
    }
  }
  if (isFirst && children.length === 1) return null;

  // If everything from overflow onward is trivial (blank lines), do not create a page
  const startIndex = isFirst ? 1 : children.indexOf(overflowChild);
  const moving = children.slice(Math.max(0, startIndex));
  if (moving.length > 0 && moving.every(isTrivialOverflowNode)) return null;

  const next = createSheet(0, landscape);
  moving.forEach((child) => next.appendChild(child));
  return next;
};

/**
 * Keep A4 width fixed, wrap content, and add another sheet when height overflows.
 */
export function paginateToA4Sheets(root: HTMLElement, landscape: boolean, reflow = true) {
  // Pull any Enter-created nodes outside .page back into the sheet first
  absorbOrphansIntoPages(root, landscape);

  let pages = Array.from(root.querySelectorAll(":scope > .page")) as HTMLElement[];
  if (pages.length === 0) {
    const sheet = createSheet(1, landscape);
    while (root.firstChild) sheet.appendChild(root.firstChild);
    root.appendChild(sheet);
    pages = [sheet];
  }

  pages.forEach((page, index) => applySheetBox(page, landscape, index + 1));

  if (reflow && pages.length > 1) {
    const first = pages[0];
    pages.slice(1).forEach((page) => {
      while (page.firstChild) first.appendChild(page.firstChild);
      page.remove();
    });
    pages = [first];
    applySheetBox(first, landscape, 1);
  }

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    applySheetBox(page, landscape, index + 1);
    let guard = 0;
    while (page.scrollHeight > a4SheetHeightPx(landscape) + 2 && guard < 200) {
      guard += 1;
      const overflow = pushOverflowToNextPage(page, landscape);
      if (!overflow || !overflow.childNodes.length) break;
      const existingNext = pages[index + 1];
      if (existingNext) {
        while (overflow.lastChild) {
          existingNext.insertBefore(overflow.lastChild, existingNext.firstChild);
        }
      } else {
        page.after(overflow);
        pages.splice(index + 1, 0, overflow);
      }
    }
  }

  // Drop blank sheets created by Docling/import (leading empty page)
  const after = Array.from(root.querySelectorAll(":scope > .page")) as HTMLElement[];
  after.forEach((page) => {
    if (after.length > 1 && !hasVisibleContent(page.innerHTML)) {
      page.remove();
    }
  });

  Array.from(root.querySelectorAll(":scope > .page")).forEach((page, index) => {
    applySheetBox(page as HTMLElement, landscape, index + 1);
  });
}

const pageMarkup = (
  pageNo: number,
  width: number,
  height: number,
  innerHtml: string,
  landscape = false
) => {
  const landscapeClass = landscape ? " is-landscape" : "";
  return `<div class="page${landscapeClass}" data-page="${pageNo}" data-native-width="${width}" data-native-height="${height}" style="${pageStyle(landscape)}">${innerHtml}</div>`;
};

const parseHtml = (html: string) => new DOMParser().parseFromString(html || "", "text/html");

const hasVisibleContent = (html: string): boolean => {
  if (!html.trim()) return false;
  const parsed = parseHtml(`<div>${html}</div>`);
  const text = (parsed.body.textContent || "").replace(/\u00a0/g, " ").trim();
  return Boolean(text || parsed.body.querySelector("img, table, svg, canvas"));
};

/** Drop blank A4 sheets (leading empty import pages) and renumber. */
export const removeEmptyPages = (root: HTMLElement) => {
  const pages = Array.from(root.querySelectorAll(":scope > .page")) as HTMLElement[];
  if (pages.length === 0) return;

  pages.forEach((page) => {
    // Keep a single empty sheet so the editor still has a place to type
    const remaining = root.querySelectorAll(":scope > .page").length;
    if (remaining > 1 && !hasVisibleContent(page.innerHTML)) {
      page.remove();
    }
  });

  Array.from(root.querySelectorAll(":scope > .page")).forEach((page, index) => {
    applySheetBox(
      page as HTMLElement,
      (page as HTMLElement).classList.contains("is-landscape"),
      index + 1
    );
  });
};

const joinNonEmptyPages = (parts: string[]) =>
  parts.filter((part) => {
    const inner = part.replace(/^<div[^>]*>/, "").replace(/<\/div>\s*$/, "");
    return hasVisibleContent(inner);
  }).join("\n");

const neutralizeOverlappingLayout = (root: ParentNode) => {
  root.querySelectorAll("*").forEach((node) => {
    const el = node as HTMLElement;
    if (!el.style) return;
    const position = (el.style.position || "").toLowerCase();
    if (position === "absolute" || position === "fixed" || position === "sticky") {
      el.style.position = "static";
      el.style.left = "";
      el.style.top = "";
      el.style.right = "";
      el.style.bottom = "";
      el.style.transform = "";
      el.style.zIndex = "";
    }
    el.style.float = "";
    if (parseFloat(el.style.marginTop) < 0) el.style.marginTop = "";
    if (parseFloat(el.style.marginBottom) < 0) el.style.marginBottom = "";
  });
};

const innerFromExtractHtml = (html: string): string => {
  const parsed = parseHtml(html);
  neutralizeOverlappingLayout(parsed.body);
  parsed.body.querySelectorAll("style, script, meta, title").forEach((node) => node.remove());
  const content = parsed.querySelector(".docling-page-content");
  if (content) return content.innerHTML.trim();
  const sheet = parsed.querySelector(".docling-page, .page");
  if (sheet) return sheet.innerHTML.trim();
  return parsed.body.innerHTML.trim();
};

const jsonPageList = (docling?: DoclingDocument | Record<string, ExtractedPage> | null): ExtractedPage[] => {
  if (!docling) return [];
  const pages = (docling as DoclingDocument).pages;
  if (pages && typeof pages === "object") {
    return Object.values(pages).sort((a, b) => (a.page_no || 0) - (b.page_no || 0));
  }
  return [];
};

const itemPageNo = (item: any): number | null => {
  const fromProv = Number(item?.prov?.[0]?.page_no);
  if (Number.isFinite(fromProv) && fromProv > 0) return fromProv;
  const direct = Number(item?.page_no || item?.page);
  if (Number.isFinite(direct) && direct > 0) return direct;
  return null;
};

const textPageLookups = (doc?: DoclingDocument | null): Array<{ page: number; text: string }> => {
  if (!doc) return [];
  const items = [...(doc.texts || []), ...(doc.tables || []), ...(doc.pictures || [])];
  return items
    .map((item) => ({
      page: itemPageNo(item) || 0,
      text: String(item?.text || item?.orig || "").replace(/\s+/g, " ").trim(),
    }))
    .filter((item) => item.page > 0 && item.text.length > 8);
};

const collectBlocks = (html: string): string[] => {
  const parsed = parseHtml(html);
  neutralizeOverlappingLayout(parsed.body);
  parsed.body.querySelectorAll("style, script, meta, title").forEach((node) => node.remove());
  const roots = Array.from(
    parsed.body.querySelectorAll(".docling-page-content, .page")
  ) as HTMLElement[];
  const sourceRoots = roots.length > 0 ? roots : [parsed.body];
  const blocks: string[] = [];

  sourceRoots.forEach((root) => {
    Array.from(root.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains("page-break") || el.classList.contains("page")) {
          if (el.classList.contains("page") && el !== root) {
            collectBlocks(el.outerHTML).forEach((block) => blocks.push(block));
            return;
          }
          if (el.classList.contains("page-break")) {
            blocks.push("<!--page-break-->");
            return;
          }
        }
        if (el.innerHTML.trim() || el.tagName === "IMG") {
          blocks.push(el.outerHTML);
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        blocks.push(`<p>${node.textContent.trim()}</p>`);
      }
    });
  });

  return blocks;
};

const pageForBlock = (
  html: string,
  index: number,
  total: number,
  pageCount: number,
  lookups: Array<{ page: number; text: string }>
): number => {
  const text = parseHtml(html).body.textContent?.replace(/\s+/g, " ").trim() || "";
  if (text) {
    const hit = lookups.find(
      (item) => text.includes(item.text.slice(0, 80)) || item.text.includes(text.slice(0, 80))
    );
    if (hit) return Math.min(pageCount, hit.page);
  }
  if (pageCount <= 1 || total <= 0) return 1;
  return Math.min(pageCount, Math.floor((index * pageCount) / total) + 1);
};

const splitBlocksAcrossPages = (
  blocks: string[],
  pageCount: number,
  lookups: Array<{ page: number; text: string }>,
  pageMeta: ExtractedPage[],
  landscape = false
): string => {
  const buckets = new Map<number, string[]>();
  const contentBlocks = blocks.filter((block) => block !== "<!--page-break-->");
  const useBreaks = blocks.includes("<!--page-break-->") && lookups.length === 0;
  let current = 1;
  let contentIndex = 0;

  blocks.forEach((block) => {
    if (block === "<!--page-break-->") {
      current = Math.min(pageCount, current + 1);
      return;
    }
    const pageNo = useBreaks
      ? current
      : pageForBlock(block, contentIndex, contentBlocks.length, pageCount, lookups);
    contentIndex += 1;
    const list = buckets.get(pageNo) || [];
    list.push(block);
    buckets.set(pageNo, list);
  });

  const rendered = Array.from({ length: pageCount }, (_, index) => {
    const meta = pageMeta[index];
    const pageNo = meta?.page_no || index + 1;
    const inner = (buckets.get(pageNo) || []).join("");
    if (!hasVisibleContent(inner)) return "";
    return pageMarkup(
      pageNo,
      meta?.size?.width || DEFAULT_PAGE_WIDTH_PT,
      meta?.size?.height || DEFAULT_PAGE_HEIGHT_PT,
      inner,
      landscape
    );
  }).filter(Boolean);

  // Renumber after dropping empty Docling pages so content starts on page 1
  return rendered
    .map((markup, index) =>
      markup.replace(/data-page="\d+"/, `data-page="${index + 1}"`)
    )
    .join("\n");
};

/**
 * Apply standard A4 width. Height stays at least one sheet; extra content paginates separately.
 */
export function applyLandscapeToPages(root: ParentNode, landscape: boolean) {
  const host = root as HTMLElement;
  host.querySelectorAll(".page").forEach((node, index) => {
    applySheetBox(node as HTMLElement, landscape, index + 1);
  });
  if (host instanceof HTMLElement) {
    paginateToA4Sheets(host, landscape, true);
  }
}

/**
 * Build one sheet per PDF page and put each block on the page it belongs to.
 * Docling often returns all HTML in a single `.page`; json.pages still has 2–3 pages.
 */
export function buildDocumentPagesHtml(
  html: string,
  docling?: DoclingDocument | Record<string, ExtractedPage> | null,
  _markdown?: string,
  extractPages?: ExtractedRenderPage[] | null,
  landscape = false
): string {
  const doc = (docling || {}) as DoclingDocument;
  const jsonPages = jsonPageList(doc);
  const extractInners = (extractPages || []).map((page) => innerFromExtractHtml(page.html || ""));
  const distinctExtract = new Set(extractInners.filter((inner) => hasVisibleContent(inner)));

  if (extractInners.length > 1 && distinctExtract.size > 1) {
    return joinNonEmptyPages(
      extractInners.map((inner, index) => {
        if (!hasVisibleContent(inner)) return "";
        const meta = extractPages?.[index];
        const jsonMeta = jsonPages[index];
        return pageMarkup(
          index + 1,
          meta?.width_pt || jsonMeta?.size?.width || DEFAULT_PAGE_WIDTH_PT,
          meta?.height_pt || jsonMeta?.size?.height || DEFAULT_PAGE_HEIGHT_PT,
          inner,
          landscape
        );
      })
    );
  }

  const parsed = parseHtml(html);
  neutralizeOverlappingLayout(parsed.body);
  const htmlPages = Array.from(parsed.body.querySelectorAll(".page")) as HTMLElement[];
  const htmlPagesWithContent = htmlPages.filter((page) => hasVisibleContent(page.innerHTML));

  if (htmlPagesWithContent.length > 1) {
    // Only keep pages that actually have content (skip blank leading PDF pages)
    return joinNonEmptyPages(
      htmlPagesWithContent.map((source, index) =>
        pageMarkup(
          index + 1,
          jsonPages[index]?.size?.width || DEFAULT_PAGE_WIDTH_PT,
          jsonPages[index]?.size?.height || DEFAULT_PAGE_HEIGHT_PT,
          source.innerHTML.trim(),
          landscape
        )
      )
    );
  }

  const blob =
    extractInners.find((inner) => hasVisibleContent(inner)) ||
    (htmlPagesWithContent[0] ? htmlPagesWithContent[0].innerHTML.trim() : "") ||
    innerFromExtractHtml(html);

  const pageCount = Math.max(jsonPages.length, extractPages?.length || 0, 1);
  const blocks = collectBlocks(blob);

  if (pageCount > 1 && blocks.length > 0) {
    return splitBlocksAcrossPages(blocks, pageCount, textPageLookups(doc), jsonPages, landscape);
  }

  return pageMarkup(
    jsonPages[0]?.page_no || 1,
    jsonPages[0]?.size?.width || DEFAULT_PAGE_WIDTH_PT,
    jsonPages[0]?.size?.height || DEFAULT_PAGE_HEIGHT_PT,
    blob,
    landscape
  );
}

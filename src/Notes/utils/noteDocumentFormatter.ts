import { updateTableHeadersAndSl } from "./noteEditorTableHelpers";

/**
 * Converts manually typed lists (e.g. "• item", "- item", "1. item") into semantic <ul>/<ol>
 */
export const convertManualListsInContainer = (container: HTMLElement) => {
  const listContainers = [
    container,
    ...Array.from(container.querySelectorAll<HTMLElement>("blockquote, td")),
  ];

  listContainers.forEach((parent) => {
    const children = Array.from(parent.children);
    let activeList: HTMLUListElement | HTMLOListElement | null = null;
    let activeType: "ul" | "ol" | null = null;

    children.forEach((child) => {
      if (child.tagName === "P" || child.tagName === "DIV") {
        const rawText = (child.textContent || "").trim();
        const bulletMatch = rawText.match(/^([•\-\*▪–—])\s+(.+)$/s);
        const numberMatch = rawText.match(/^(\d+)[\.\)\-]\s+(.+)$/s);

        if (bulletMatch) {
          if (activeType !== "ul" || !activeList) {
            activeList = document.createElement("ul");
            activeType = "ul";
            child.parentNode?.insertBefore(activeList, child);
          }
          const li = document.createElement("li");
          const cloned = child.cloneNode(true) as HTMLElement;
          // Strip leading bullet marker from first non-empty text node
          const firstTextNode = Array.from(cloned.childNodes).find(
            (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0
          );
          if (firstTextNode && firstTextNode.textContent) {
            firstTextNode.textContent = firstTextNode.textContent.replace(
              /^([•\-\*▪–—])\s+/,
              ""
            );
          }
          while (cloned.firstChild) li.appendChild(cloned.firstChild);
          activeList.appendChild(li);
          child.remove();
          return;
        } else if (numberMatch) {
          if (activeType !== "ol" || !activeList) {
            activeList = document.createElement("ol");
            activeType = "ol";
            child.parentNode?.insertBefore(activeList, child);
          }
          const li = document.createElement("li");
          const cloned = child.cloneNode(true) as HTMLElement;
          const firstTextNode = Array.from(cloned.childNodes).find(
            (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0
          );
          if (firstTextNode && firstTextNode.textContent) {
            firstTextNode.textContent = firstTextNode.textContent.replace(
              /^(\d+)[\.\)\-]\s+/,
              ""
            );
          }
          while (cloned.firstChild) li.appendChild(cloned.firstChild);
          activeList.appendChild(li);
          child.remove();
          return;
        }
      }

      activeList = null;
      activeType = null;
    });
  });
};

/**
 * Comprehensive Document Formatting & Visual Structure Normalizer
 */
export const formatDocumentStructure = (container: HTMLElement) => {
  // 1. Strip external Office, web metadata, scripts, and comments
  const junkSelectors = "o\\:p, xml, style, meta, link, script, noscript";
  try {
    container.querySelectorAll(junkSelectors).forEach((t) => t.remove());
  } catch {
    // ignore
  }

  // Unwrap <font> tags while preserving their children
  container.querySelectorAll("font").forEach((font) => {
    while (font.firstChild) {
      font.parentNode?.insertBefore(font.firstChild, font);
    }
    font.remove();
  });

  // 2. Convert raw <div> lines to <p> (except attachment containers and tables)
  const divs = Array.from(container.querySelectorAll("div"));
  divs.forEach((div) => {
    if (
      div.classList.contains("row-attach-container") ||
      div.classList.contains("table-file-badge") ||
      div.closest(".row-attach-container") ||
      div.closest(".table-file-badge") ||
      div.querySelector("table, ul, ol, blockquote, pre")
    ) {
      return;
    }
    const p = document.createElement("p");
    while (div.firstChild) {
      p.appendChild(div.firstChild);
    }
    div.parentNode?.replaceChild(p, div);
  });

  // 3. Collapse multiple consecutive <br> tags within blocks
  const blocksWithBrs = container.querySelectorAll("p, div, li, blockquote");
  blocksWithBrs.forEach((el) => {
    let consecutiveBrCount = 0;
    const nodes = Array.from(el.childNodes);
    nodes.forEach((node) => {
      if (node.nodeName === "BR") {
        consecutiveBrCount++;
        if (consecutiveBrCount > 1) {
          node.remove();
        }
      } else if (
        node.nodeType === Node.TEXT_NODE &&
        (node.textContent || "").trim() === ""
      ) {
        // empty space between brs, ignore
      } else {
        consecutiveBrCount = 0;
      }
    });
  });

  // 4. Convert manual bullet points and numbered lists
  convertManualListsInContainer(container);

  // 5. Detect and promote obvious headings / section titles
  const paras = Array.from(container.querySelectorAll("p"));
  paras.forEach((p) => {
    if (p.closest("table") || p.closest("ul") || p.closest("ol") || p.closest("blockquote")) {
      return;
    }
    const rawText = (p.textContent || "").trim();
    if (!rawText) return;

    // Markdown # Heading
    const mdH1 = rawText.match(/^#\s+(.+)$/);
    const mdH2 = rawText.match(/^##\s+(.+)$/);
    const mdH3 = rawText.match(/^###+\s+(.+)$/);
    if (mdH1) {
      const h = document.createElement("h2");
      h.textContent = mdH1[1];
      p.parentNode?.replaceChild(h, p);
      return;
    }
    if (mdH2) {
      const h = document.createElement("h2");
      h.textContent = mdH2[1];
      p.parentNode?.replaceChild(h, p);
      return;
    }
    if (mdH3) {
      const h = document.createElement("h3");
      h.textContent = mdH3[1];
      p.parentNode?.replaceChild(h, p);
      return;
    }

    // Standalone Bold Heading: e.g. <p><b>Important Section Title</b></p>
    if (
      p.children.length === 1 &&
      (p.children[0].tagName === "B" || p.children[0].tagName === "STRONG") &&
      rawText.length > 2 &&
      rawText.length <= 80 &&
      !rawText.endsWith(".")
    ) {
      const h = document.createElement("h3");
      while (p.children[0].firstChild) {
        h.appendChild(p.children[0].firstChild);
      }
      p.parentNode?.replaceChild(h, p);
      return;
    }

    // Standalone uppercase section title or ending in colon (e.g. "PROJECT OVERVIEW:", "DELIVERABLES:")
    const isShortTitle =
      rawText.length >= 3 &&
      rawText.length <= 60 &&
      ((rawText === rawText.toUpperCase() && /[A-Z]/.test(rawText)) ||
        (rawText.endsWith(":") && !rawText.includes(".")));
    if (isShortTitle && !p.querySelector("img, a, input, button")) {
      const h = document.createElement("h3");
      while (p.firstChild) {
        h.appendChild(p.firstChild);
      }
      p.parentNode?.replaceChild(h, p);
      return;
    }
  });

  // 6. Normalize headings (h4-h6 promoted to h3) and clean typography
  container.querySelectorAll("h4, h5, h6").forEach((h) => {
    const h3 = document.createElement("h3");
    while (h.firstChild) h3.appendChild(h.firstChild);
    h.parentNode?.replaceChild(h3, h);
  });

  // 7. Strip dirty external styles, normalize typography & spacing
  const allElements = Array.from(container.querySelectorAll<HTMLElement>("*"));
  allElements.forEach((el) => {
    // NEVER touch attachment chips, download buttons, or preview buttons!
    if (
      el.classList.contains("table-file-badge") ||
      el.classList.contains("row-attach-container") ||
      el.classList.contains("row-attach-add-btn") ||
      el.classList.contains("row-attach-upload-btn") ||
      el.closest(".table-file-badge") ||
      el.closest(".row-attach-container")
    ) {
      return;
    }

    const tagName = el.tagName;
    const isTable = tagName === "TABLE";
    const isTh = tagName === "TH";
    const isTd = tagName === "TD";
    const isHeading = ["H1", "H2", "H3"].includes(tagName);
    const isList = tagName === "UL" || tagName === "OL";
    const isLi = tagName === "LI";
    const isPara = tagName === "P";

    // Strip foreign fonts, sizes, line-heights, letter-spacing
    el.style.removeProperty("font-family");
    el.style.removeProperty("font-size");
    el.style.removeProperty("line-height");
    el.style.removeProperty("letter-spacing");
    el.style.removeProperty("word-spacing");
    el.style.removeProperty("text-indent");
    el.style.removeProperty("margin-left");
    el.style.removeProperty("margin-right");
    el.style.removeProperty("max-width");

    // Apply standard WorkSphere document styling
    if (isPara) {
      el.style.margin = "0 0 0.65rem 0";
      el.style.lineHeight = "1.75";
    } else if (isHeading) {
      el.style.marginTop = tagName === "H1" ? "1.25rem" : tagName === "H2" ? "1rem" : "0.75rem";
      el.style.marginBottom = "0.4rem";
      el.style.fontWeight = tagName === "H1" || tagName === "H2" ? "700" : "600";
      el.style.color = "#1B2559";
    } else if (isList) {
      el.style.paddingLeft = "1.75rem";
      el.style.marginTop = "0.4rem";
      el.style.marginBottom = "0.6rem";
    } else if (isLi) {
      el.style.marginBottom = "0.25rem";
      el.style.lineHeight = "1.7";
    } else if (!isTable && !isTh && !isTd) {
      el.style.removeProperty("margin-top");
      el.style.removeProperty("margin-bottom");
      el.style.removeProperty("width");
    }

    // Clean background-color if external web highlight
    const bg = el.style.backgroundColor;
    if (bg && bg !== "transparent" && !bg.startsWith("var(--tbl-") && !isTh && !isTd) {
      el.style.removeProperty("background-color");
    }

    // Clean text color if external web color
    const color = el.style.color;
    if (color && !color.startsWith("var(--tbl-") && color !== "inherit" && !isHeading) {
      el.style.removeProperty("color");
    }

    // Clean external borders if not a table or cell
    if (!isTable && !isTh && !isTd) {
      el.style.removeProperty("border");
      el.style.removeProperty("border-top");
      el.style.removeProperty("border-bottom");
      el.style.removeProperty("border-left");
      el.style.removeProperty("border-right");
    }

    // Remove dirty external classes
    const classList = Array.from(el.classList);
    classList.forEach((cls) => {
      if (
        !cls.startsWith("excel-") &&
        !cls.startsWith("table-") &&
        !cls.startsWith("row-") &&
        !cls.startsWith("a4-") &&
        !cls.startsWith("bg-tbl-")
      ) {
        el.classList.remove(cls);
      }
    });
    if (el.classList.length === 0) {
      el.removeAttribute("class");
    }

    // Remove empty style attributes
    if (!el.getAttribute("style") || el.getAttribute("style")?.trim() === "") {
      el.removeAttribute("style");
    }

    // Unwrap empty/useless spans
    if (tagName === "SPAN" && el.attributes.length === 0) {
      while (el.firstChild) {
        el.parentNode?.insertBefore(el.firstChild, el);
      }
      el.remove();
    }
  });

  // 8. Clean and normalize tables
  const tables = Array.from(container.querySelectorAll<HTMLTableElement>("table"));
  tables.forEach((tbl) => {
    tbl.style.borderCollapse = "collapse";
    tbl.style.margin = "1rem 0";
    tbl.style.border = "1px solid #64748b";

    // If missing thead, promote first row
    if (!tbl.querySelector("thead") && tbl.rows.length > 0) {
      const thead = tbl.createTHead();
      const firstRow = tbl.rows[0];
      thead.appendChild(firstRow);
      Array.from(firstRow.cells).forEach((c) => {
        const th = document.createElement("th");
        while (c.firstChild) th.appendChild(c.firstChild);
        c.parentNode?.replaceChild(th, c);
      });
    }

    // Header cells styling
    tbl.querySelectorAll("th").forEach((th) => {
      if (!th.classList.contains("excel-sl-col")) {
        th.style.backgroundColor = "#f8fafc";
        th.style.fontWeight = "600";
        th.style.color = "#1e293b";
        th.style.textAlign = "center";
        th.style.border = "1px solid #64748b";
        th.style.padding = "8px 14px";
      }
    });

    // Data cells styling
    tbl.querySelectorAll("td").forEach((td) => {
      if (!td.classList.contains("excel-sl-col")) {
        td.style.border = "1px solid #64748b";
        td.style.padding = "8px 14px";
        td.style.color = "#1e293b";
      }
    });

    // Maintain Excel headers and SL column
    updateTableHeadersAndSl(tbl);
  });

  // 9. Remove excessive blank paragraphs (more than 1 consecutive empty paragraph)
  const paragraphs = Array.from(container.querySelectorAll("p"));
  let consecutiveEmptyCount = 0;
  paragraphs.forEach((p) => {
    const text = (p.textContent || "").trim();
    const hasMedia = p.querySelector("img, table, iframe, svg, canvas, button");
    const isEmpty = text.length === 0 && !hasMedia;

    if (isEmpty) {
      consecutiveEmptyCount++;
      if (consecutiveEmptyCount > 1) {
        p.remove();
      } else {
        p.innerHTML = "<br/>";
      }
    } else {
      consecutiveEmptyCount = 0;
    }
  });

  // Clean leading and trailing empty paragraphs
  while (
    container.firstElementChild &&
    container.firstElementChild.tagName === "P" &&
    !(container.firstElementChild.textContent || "").trim() &&
    !container.firstElementChild.querySelector("img, table, iframe, button")
  ) {
    container.firstElementChild.remove();
  }
  while (
    container.lastElementChild &&
    container.lastElementChild.tagName === "P" &&
    !(container.lastElementChild.textContent || "").trim() &&
    !container.lastElementChild.querySelector("img, table, iframe, button")
  ) {
    container.lastElementChild.remove();
  }
};

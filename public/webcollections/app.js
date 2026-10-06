const categoryList = document.querySelector("#category-list");
const bookmarkGrid = document.querySelector("#bookmark-grid");
const searchInput = document.querySelector("#search-input");
const resultCount = document.querySelector("#result-count");
const collectionTitle = document.querySelector("#collection-title");
const emptyState = document.querySelector("#empty-state");
const loadError = document.querySelector("#load-error");

let categories = [];
let links = [];
let selectedCategory = "all";

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const getCategoryName = (categoryId) =>
  categories.find((category) => category.id === categoryId)?.name || "其他收藏";

const getVisibleLinks = () => {
  const query = searchInput.value.trim().toLocaleLowerCase();
  return links.filter((link) => {
    const categoryMatches =
      selectedCategory === "all" ||
      (selectedCategory === "favorites" ? link.favorite : link.category === selectedCategory);
    const searchText = [link.name, link.description, link.url, ...(link.tags || [])]
      .join(" ")
      .toLocaleLowerCase();
    return categoryMatches && searchText.includes(query);
  });
};

const renderCategories = () => {
  categoryList.replaceChildren();
  const items = [
    { id: "all", name: "全部收藏", count: links.length },
    { id: "favorites", name: "常用网站", count: links.filter((link) => link.favorite).length },
    ...categories.map((category) => ({
      ...category,
      count: links.filter((link) => link.category === category.id).length,
    })),
  ];

  for (const item of items) {
    const button = createElement("button", "category-button");
    button.type = "button";
    button.dataset.category = item.id;
    button.setAttribute("aria-pressed", String(selectedCategory === item.id));
    button.append(
      createElement("span", "category-label", item.name),
      createElement("span", "category-count", String(item.count).padStart(2, "0")),
    );
    button.addEventListener("click", () => {
      selectedCategory = item.id;
      renderCategories();
      renderLinks();
    });
    categoryList.append(button);
  }
};

const renderLinks = () => {
  const visibleLinks = getVisibleLinks();
  bookmarkGrid.replaceChildren();
  resultCount.textContent = String(visibleLinks.length).padStart(2, "0");
  const currentName =
    selectedCategory === "all"
      ? "全部收藏"
      : selectedCategory === "favorites"
        ? "常用网站"
        : getCategoryName(selectedCategory);
  collectionTitle.firstChild.textContent = `${currentName} `;
  emptyState.hidden = visibleLinks.length > 0;

  for (const link of visibleLinks) {
    const card = createElement("a", "bookmark-card");
    card.href = link.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `打开 ${link.name}，新窗口`);

    const category = createElement("span", "card-category", getCategoryName(link.category));

    const body = createElement("div", "card-body");
    body.append(category, createElement("h3", "card-title", link.name));
    body.append(createElement("p", "card-description", link.description || "收藏的网址"));

    const footer = createElement("div", "card-footer");
    footer.append(createElement("span", "card-domain", new URL(link.url).hostname));
    if (link.favorite) footer.append(createElement("span", "favorite-mark", "常用"));

    card.append(body, footer);
    bookmarkGrid.append(card);
  }
};

searchInput.addEventListener("input", renderLinks);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
    searchInput.blur();
    renderLinks();
  }
});

const loadBookmarks = async () => {
  try {
    const response = await fetch("./webcollections.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.categories) || !Array.isArray(data.links)) {
      throw new Error("书签数据格式错误");
    }
    categories = data.categories.filter((category) => category.id && category.name);
    links = data.links.filter((link) => {
      try {
        return link.name && ["http:", "https:"].includes(new URL(link.url).protocol);
      } catch {
        return false;
      }
    });
    renderCategories();
    renderLinks();
  } catch (error) {
    console.error("网址集加载失败", error);
    loadError.hidden = false;
  }
};

loadBookmarks();

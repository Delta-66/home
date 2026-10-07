const categoryList = document.querySelector("#category-list");
const bookmarkGrid = document.querySelector("#bookmark-grid");
const searchInput = document.querySelector("#search-input");
const resultCount = document.querySelector("#result-count");
const collectionTitle = document.querySelector("#collection-title");
const emptyState = document.querySelector("#empty-state");
const loadError = document.querySelector("#load-error");
const collectionLayout = document.querySelector(".collection-layout");
const heroCopy = document.querySelector(".hero-copy");
const addLinkButton = document.querySelector("#add-link-button");
const addLinkDialog = document.querySelector("#add-link-dialog");
const addLinkForm = document.querySelector("#add-link-form");
const linkCategory = document.querySelector("#link-category");
const formError = document.querySelector("#form-error");
const dialogNote = document.querySelector("#dialog-note");
const saveLinkButton = addLinkForm.querySelector('[type="submit"]');
const apiUrl = new URL("../api/webcollections", window.location.href);
const expectsFileSave = ["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port === "3000";
const storageKey = "webcollections:user-links";

let categories = [];
let links = [];
let siteLinks = [];
let userLinks = [];
let selectedCategory = "all";
let fileSaveAvailable = false;

const getHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
};

const isValidLink = (link) =>
  Boolean(link && typeof link.name === "string" && link.name.trim() &&
  typeof link.url === "string" && getHttpUrl(link.url));

try {
  const savedLinks = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(savedLinks)) {
    userLinks = savedLinks.filter(isValidLink).map((link) => ({
      name: link.name.trim(),
      url: getHttpUrl(link.url).href,
      description: typeof link.description === "string" ? link.description : "",
      category: typeof link.category === "string" ? link.category : "other",
      favorite: link.favorite === true,
    }));
  }
} catch (error) {
  console.warn("本地网址读取失败", error);
}

const saveUserLinks = (nextLinks) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextLinks));
    userLinks = nextLinks;
    links = [...siteLinks, ...userLinks];
    renderCategories();
    renderLinks();
    return true;
  } catch (error) {
    console.error("本地网址保存失败", error);
    return false;
  }
};

const updateCategoryOptions = () => {
  linkCategory.replaceChildren();
  const availableCategories = categories.length ? categories : [{ id: "other", name: "其他收藏" }];
  for (const category of availableCategories) {
    const option = createElement("option", "", category.name);
    option.value = category.id;
    linkCategory.append(option);
  }
};

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
    if (userLinks.includes(link) || fileSaveAvailable) {
      const item = createElement("div", "bookmark-item");
      const removeButton = createElement("button", "remove-link-button", "删除");
      removeButton.type = "button";
      removeButton.setAttribute("aria-label", `删除 ${link.name}`);
      removeButton.addEventListener("click", async () => {
        if (!window.confirm(`确定删除“${link.name}”吗？`)) return;
        if (fileSaveAvailable) {
          try {
            const response = await fetch(apiUrl, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: link.url }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "删除失败。");
            siteLinks = siteLinks.filter((savedLink) => savedLink !== link);
            links = [...siteLinks, ...userLinks];
            renderCategories();
            renderLinks();
          } catch (error) {
            window.alert(error.message || "删除失败，请检查本地服务。");
          }
        } else if (!saveUserLinks(userLinks.filter((savedLink) => savedLink !== link))) {
          window.alert("删除失败，请检查浏览器是否允许保存本地数据。");
        }
      });
      item.append(card, removeButton);
      bookmarkGrid.append(item);
    } else {
      bookmarkGrid.append(card);
    }
  }
};

searchInput.addEventListener("input", renderLinks);
addLinkButton.addEventListener("click", () => {
  addLinkForm.reset();
  formError.hidden = true;
  addLinkDialog.showModal();
  addLinkForm.elements.name.focus();
});
document.querySelector("#close-link-dialog").addEventListener("click", () => addLinkDialog.close());
document.querySelector("#cancel-link-dialog").addEventListener("click", () => addLinkDialog.close());
addLinkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;
  const name = addLinkForm.elements.name.value.trim();
  const url = getHttpUrl(addLinkForm.elements.url.value.trim());
  if (!name || !url) {
    formError.textContent = "请填写网站名称和以 http:// 或 https:// 开头的网址。";
    formError.hidden = false;
    return;
  }
  if (links.some((link) => getHttpUrl(link.url)?.href === url.href)) {
    formError.textContent = "这个网址已经在收藏中。";
    formError.hidden = false;
    return;
  }
  const newLink = {
    name,
    url: url.href,
    description: addLinkForm.elements.description.value.trim(),
    category: linkCategory.value,
    favorite: addLinkForm.elements.favorite.checked,
  };
  saveLinkButton.disabled = true;
  try {
    if (fileSaveAvailable) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLink),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存失败。");
      siteLinks.push(result.link);
      links = [...siteLinks, ...userLinks];
    } else if (!saveUserLinks([...userLinks, newLink])) {
      throw new Error("保存失败，请检查浏览器是否允许保存本地数据。");
    }
  } catch (error) {
    formError.textContent = error.message || "保存失败，请稍后重试。";
    formError.hidden = false;
    return;
  } finally {
    saveLinkButton.disabled = false;
  }
  selectedCategory = "all";
  searchInput.value = "";
  renderCategories();
  renderLinks();
  addLinkDialog.close();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !addLinkDialog.open && document.activeElement !== searchInput) {
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
    const response = await fetch(apiUrl, { cache: "no-store" });
    const capabilities = response.ok ? await response.json() : null;
    fileSaveAvailable = capabilities?.fileSave === true && capabilities?.deleteAll === true;
  } catch {
    fileSaveAvailable = false;
  }
  if (fileSaveAvailable) {
    userLinks = [];
    dialogNote.textContent = "通过本地端口添加的网址会直接保存到项目的 webcollections.json 文件。";
  } else if (expectsFileSave) {
    loadError.textContent = "本地保存服务未启用，请运行 npm run serve:local 或重新运行“启动本地网站.cmd”。";
    loadError.hidden = false;
  }
  try {
    const response = await fetch("./webcollections.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.categories) || !Array.isArray(data.links)) {
      throw new Error("书签数据格式错误");
    }
    categories = data.categories.filter((category) => category.id && category.name);
    siteLinks = data.links.filter(isValidLink);
    links = [...siteLinks, ...userLinks];
    updateCategoryOptions();
    renderCategories();
    renderLinks();
  } catch (error) {
    console.error("网址集加载失败", error);
    loadError.hidden = false;
    links = [...userLinks];
    updateCategoryOptions();
    renderCategories();
    renderLinks();
  }
  addLinkButton.disabled = (expectsFileSave && !fileSaveAvailable) || (fileSaveAvailable && !categories.length);
};

loadBookmarks();

if (collectionLayout && heroCopy && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let scrollFrame = 0;
  const updateLayers = () => {
    scrollFrame = 0;
    const distance = Math.max(320, Math.min(window.innerHeight * 0.5, 480));
    const progress = Math.min(1, Math.max(0, window.scrollY / distance));

    heroCopy.style.transform = `translate3d(0, ${(-24 * progress).toFixed(1)}px, ${(-160 * progress).toFixed(1)}px)`;
    heroCopy.style.opacity = (1 - progress * 0.58).toFixed(3);
    heroCopy.style.filter = `blur(${(progress * 1.5).toFixed(2)}px)`;
    collectionLayout.style.transform = `translate3d(0, ${(-56 * progress).toFixed(1)}px, 0)`;
    collectionLayout.style.boxShadow = `0 ${24 + Math.round(progress * 22)}px ${80 + Math.round(progress * 30)}px rgba(0, 0, 0, ${(0.17 + progress * 0.15).toFixed(3)})`;
  };
  const scheduleLayers = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateLayers);
  };

  updateLayers();
  window.addEventListener("scroll", scheduleLayers, { passive: true });
  window.addEventListener("resize", scheduleLayers);
}

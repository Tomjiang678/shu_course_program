var API_BASE = "https://jzh678.icu"
// var API_BASE = "http://localhost:8360";

let currentPage = 1;
let totalPages = 1;
let currentCategoryIds = [];

// ========================
// 📘 渲染书籍卡片（两行五列）
// ========================
function renderBooks(list) {
  const bookList = document.getElementById("bookList");

  if (!list || list.length === 0) {
    bookList.innerHTML = "<p>暂无书籍数据</p>";
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  // 网格布局
  bookList.innerHTML = list
    .map(
      (book) => `
      <div class="book-card" onclick="showBookDetail(${book.id})">
        <img src="${book.image_url || 'fallback.jpg'}" alt="${book.title}" class="book-cover" onerror="this.src='fallback.jpg'">
        <div class="book-info">
          <h3 class="book-title">${book.title}</h3>
          <p class="book-author">${book.author}</p>
        </div>
      </div>
    `
    )
    .join("");

  renderPagination();
}

// ========================
// 📖 拉取指定分类的书籍（带分页）
// ========================
async function loadBooksByCategories(categoryIds, page = 1, sortField = "") {
  try {
    currentPage = page;
    currentCategoryIds = categoryIds;

    let url = `${API_BASE}/books?category_id=${categoryIds.join(",")}&page=${page}`;
    if (sortField) url += `&sort=${sortField}`;

    const res = await fetch(url);
    const result = await res.json();

    if (result.errno === 0) {
      totalPages = result.data.totalPages;
      renderBooks(result.data.list);
    } else {
      renderBooks([]);
      console.warn("加载书籍失败：", result);
    }
  } catch (err) {
    console.error("请求书籍出错：", err);
    renderBooks([]);
  }
}

// ========================
// 📄 渲染翻页栏
// ========================
function renderPagination() {
  const pagination = document.getElementById("pagination");
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let buttons = "";

  // 上一页
  buttons += `<button ${currentPage === 1 ? "disabled" : ""} onclick="changePage(${currentPage - 1})">上一页</button>`;

  // 页码（最多显示 5 个）
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) {
    buttons += `<button class="${i === currentPage ? "active" : ""}" onclick="changePage(${i})">${i}</button>`;
  }

  // 下一页
  buttons += `<button ${currentPage === totalPages ? "disabled" : ""} onclick="changePage(${currentPage + 1})">下一页</button>`;

  pagination.innerHTML = buttons;
}

// 切换页码
function changePage(page) {
  if (page < 1 || page > totalPages) return;
  loadBooksByCategories(currentCategoryIds, page);
}

// ========================
// 📚 渲染分类树
// ========================
function renderCategories(categories, parentId = 0) {
  const ul = document.createElement("ul");
  ul.classList.add("category-list");

  categories
    .filter((cat) => cat.parent_id === parentId)
    .forEach((cat) => {
      const li = document.createElement("li");
      li.textContent = cat.name;
      li.dataset.id = cat.id;

      const children = renderCategories(categories, cat.id);
      if (children.childElementCount > 0) {
        li.classList.add("has-children");
        li.appendChild(children);

        // 一级分类点击
        li.addEventListener("click", async (e) => {
          e.stopPropagation();
          li.classList.toggle("expanded");
          const subUl = li.querySelector("ul");
          if (subUl) {
            subUl.style.display = subUl.style.display === "block" ? "none" : "block";
          }

          document.querySelectorAll(".category-list li").forEach((el) => el.classList.remove("selected"));
          li.classList.add("selected");

          const childIds = categories.filter((c) => c.parent_id === cat.id).map((c) => c.id);
          const idsToLoad = [cat.id, ...childIds];
          await loadBooksByCategories(idsToLoad, 1);
        });
      } else {
        // 二级分类点击
        li.addEventListener("click", async (e) => {
          e.stopPropagation();
          document.querySelectorAll(".category-list li").forEach((el) => el.classList.remove("selected"));
          li.classList.add("selected");
          await loadBooksByCategories([cat.id], 1);
        });
      }

      ul.appendChild(li);
    });

  return ul;
}

// ========================
// 📦 加载分类
// ========================
async function loadCategories() {
  try {
    const res = await fetch(API_BASE + "/categories");
    const result = await res.json();
    if (result.errno === 0) {
      const categories = result.data;
      const container = document.getElementById("categoryList");
      container.innerHTML = "";
      container.appendChild(renderCategories(categories));

      // 默认加载全部书籍第一页
      loadBooksByCategories(categories.map((c) => c.id), 1);
    } else {
      document.getElementById("categoryList").innerHTML = "<li>加载失败</li>";
    }
  } catch (err) {
    console.error("加载分类失败:", err);
    document.getElementById("categoryList").innerHTML = "<li>加载出错</li>";
  }
}

// ========================
// 🚀 页面初始化
// ========================
window.onload = () => {
  loadCategories();
}
// ========================
// 🔢 排序事件监听
// ========================
document.querySelectorAll('input[name="sort"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const selectedSort = document.querySelector('input[name="sort"]:checked').value;
    loadBooksByCategories(currentCategoryIds, 1, selectedSort);
  });
});
;





var API_BASE = "http://jzh678.icu/backend";
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
    buttons += `<button ${currentPage === 1 ? "disabled" : ""} onclick="changePage(${currentPage - 1})">上一页</button>`;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) {
        buttons += `<button class="${i === currentPage ? "active" : ""}" onclick="changePage(${i})">${i}</button>`;
    }
    buttons += `<button ${currentPage === totalPages ? "disabled" : ""} onclick="changePage(${currentPage + 1})">下一页</button>`;
    pagination.innerHTML = buttons;
}

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

                li.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    li.classList.toggle("expanded");
                    const subUl = li.querySelector("ul");
                    if (subUl) subUl.style.display = subUl.style.display === "block" ? "none" : "block";

                    document.querySelectorAll(".category-list li").forEach((el) => el.classList.remove("selected"));
                    li.classList.add("selected");

                    const childIds = categories.filter((c) => c.parent_id === cat.id).map((c) => c.id);
                    const idsToLoad = [cat.id, ...childIds];
                    await loadBooksByCategories(idsToLoad, 1);
                });
            } else {
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
// 📑 查看书籍详情（含修改/删除）
// ========================
async function showBookDetail(id) {
    try {
        const res = await fetch(`${API_BASE}/books/detail?id=${id}`);
        const result = await res.json();
        if (result.errno !== 0) return alert("加载书籍详情失败");

        const book = result.data;

        const modal = document.getElementById("bookModal");
        modal.style.display = "block";

        document.getElementById("detailCover").src = book.image_url || "fallback.jpg";
        document.getElementById("detailTitle").textContent = book.title;
        document.getElementById("detailAuthor").textContent = book.author;
        document.getElementById("detailPublisher").textContent = book.publisher || "未知";
        document.getElementById("detailIsbn").textContent = book.isbn || "无";
        document.getElementById("detailStock").textContent = book.stock;
        document.getElementById("detailAvailable").textContent = book.available_stock;
        document.getElementById("detailBorrow").textContent = book.borrow_count;
        document.getElementById("detailSummary").textContent = book.summary || "暂无简介";

        // 替换按钮
        document.querySelector(".borrow-btn-container").innerHTML = `
            <button class="delete-btn" onclick="deleteBook(${book.id})">🗑 删除书籍</button>
            <button class="edit-btn" onclick="editBook(${book.id})">✏ 修改信息</button>
        `;
    } catch (err) {
        console.error("加载详情失败:", err);
    }
}

function closeModal() {
    document.getElementById("bookModal").style.display = "none";
}
// ========================
// 🆕 新增书籍（支持所有字段）
// ========================
async function createBook() {
    // 用户输入信息
    const title = prompt("📘 请输入书名：");
    if (!title) return alert("❌ 书名不能为空");

    const author = prompt("✍ 请输入作者：");
    if (!author) return alert("❌ 作者不能为空");

    const publisher = prompt("🏢 请输入出版社：") || "";
    const isbn = prompt("📖 请输入 ISBN：") || "";
    const category_id = prompt("📂 请输入分类 ID（数字）：");
    if (!category_id) return alert("❌ 分类ID不能为空");
    if (isNaN(category_id)) return alert("❌ 分类 ID 必须是数字");
    const stock = prompt("📦 请输入库存数量：", "0") || "0";
    const available_stock = prompt("📗 请输入可借数量：", stock) || "0";
    const summary = prompt("📝 请输入简介（可留空）：") || "";
    const image_url = prompt("🖼 请输入封面图片URL（可留空）：") || "";

    try {
        const res = await fetch(`${API_BASE}/books/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                author,
                publisher,
                isbn,
                category_id: parseInt(category_id) || 0,
                stock: parseInt(stock) || 0,
                available_stock: parseInt(available_stock) || 0,
                summary,
                image_url
            })
        });

        const data = await res.json();

        if (data.errno === 0) {
            alert("✅ 新增成功！");
            loadBooksByCategories(currentCategoryIds, currentPage);
        } else {
            alert("❌ 新增失败：" + data.errmsg);
        }
    } catch (err) {
        console.error(err);
        alert("服务器错误，新增失败");
    }
}


// ========================
// 🚀 页面初始化
// ========================
window.onload = () => {
    loadCategories();
};

// ========================
// 🔢 排序事件监听
// ========================
document.querySelectorAll('input[name="sort"]').forEach((radio) => {
    radio.addEventListener("change", () => {
        const selectedSort = document.querySelector('input[name="sort"]:checked').value;
        loadBooksByCategories(currentCategoryIds, 1, selectedSort);
    });
});

// ========================
// 🔍 搜索功能（模糊查询）
// ========================
async function searchBooks(keyword) {
  try {
    const res = await fetch(`${API_BASE}/search?keyword=${encodeURIComponent(keyword)}`);
    const data = await res.json();

    const container = document.getElementById("searchResults");
    if (!data || data.length === 0) {
      container.innerHTML = `<p>未找到与 "${keyword}" 相关的书籍</p>`;
      return;
    }

    // 渲染结果列表
    container.innerHTML = data.map(book => `
      <div class="book-result" onclick="showBookDetail(${book.id})" 
           style="padding:8px;border-bottom:1px solid #eee;cursor:pointer;">
        <strong>${book.title}</strong> — ${book.author || "佚名"}
      </div>
    `).join('');
  } catch (err) {
    console.error("搜索失败:", err);
    document.getElementById("searchResults").innerHTML = `<p>搜索出错，请稍后重试</p>`;
  }
}

// ✅ 监听搜索表单提交
const searchForm = document.getElementById("searchForm");
if (searchForm) {
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // 阻止跳转
    const keyword = document.getElementById("searchKeyword").value.trim();
    if (!keyword) return showAlert("请输入关键词");
    await searchBooks(keyword);
  });
}

// ✅ 点击空白处隐藏搜索结果
document.addEventListener("click", (e) => {
  const searchContainer = document.getElementById("searchResults");
  const searchInput = document.getElementById("searchKeyword");

  if (!searchContainer || !searchInput) return;

  // 如果点击的不是搜索框，也不是搜索结果容器里的元素
  if (!searchContainer.contains(e.target) && e.target !== searchInput) {
    searchContainer.innerHTML = "";
  }
});
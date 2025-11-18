// ========================
// 📖 书籍详情弹窗
// ========================
async function showBookDetail(bookId) {
  try {
    const res = await fetch(`${API_BASE}/books/detail?id=${bookId}`);
    const result = await res.json();
    if (result.errno === 0) {
      const book = result.data;

      document.getElementById("detailCover").src = book.image_url || "fallback.jpg";
      document.getElementById("detailTitle").innerText = book.title;
      document.getElementById("detailAuthor").innerText = book.author;
      document.getElementById("detailPublisher").innerText = book.publisher;
      document.getElementById("detailIsbn").innerText = book.isbn;
      document.getElementById("detailStock").innerText = book.stock;
      document.getElementById("detailAvailable").innerText = book.available_stock;
      document.getElementById("detailBorrow").innerText = book.borrow_count;
      document.getElementById("detailSummary").innerText = book.summary || "暂无简介";

      // ✅ 在模态框上保存 book_id
      document.getElementById("bookModal").dataset.bookId = book.id;

      document.getElementById("bookModal").style.display = "block";
    }
  } catch (err) {
    console.error("加载书籍详情失败:", err);
  }
}

function closeModal() {
  document.getElementById("bookModal").style.display = "none";
}


async function borrowBook() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    showAlert("请先登录再借阅！");
    return;
  }

  // ✅ 从模态框的 dataset 获取书籍ID
  const bookId = document.getElementById("bookModal").dataset.bookId;


  if (!bookId) {
    showAlert("无法识别书籍 ID");
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/borrow/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.user_id,  // 登录用户ID
        book_id: bookId    // 书籍主键ID
      })
    });

    const data = await res.json();
    if (data.errno === 0) {
      showAlert(`📚 借阅成功：《${document.getElementById("detailTitle").innerText}》`);
      closeModal();
    } else {
      showAlert(data.errmsg || "借阅失败");
    }
  } catch (err) {
    console.error(err);
    showAlert("服务器错误，借阅失败");
  }
}
// ========================
// ✏️ 编辑书籍（支持更多字段）
// ========================
async function editBook() {
  const modal = document.getElementById("bookModal");
  const bookId = modal.dataset.bookId;

  if (!bookId) {
    alert("无法识别书籍 ID");
    return;
  }

  // 从详情模态框中取当前值作为默认值
  const currentTitle = document.getElementById("detailTitle").innerText;
  const currentAuthor = document.getElementById("detailAuthor").innerText;
  const currentPublisher = document.getElementById("detailPublisher").innerText;
  const currentStock = document.getElementById("detailStock").innerText;
  const currentAvailable = document.getElementById("detailAvailable").innerText;
  const currentSummary = document.getElementById("detailSummary").innerText;
  const currentImage = document.getElementById("detailCover").src;

  // 多次 prompt 输入
  const title = prompt("📘 请输入新的书名：", currentTitle);
  if (title === null) return; // 用户取消

  const author = prompt("✍ 请输入作者：", currentAuthor);
  if (author === null) return;

  const publisher = prompt("🏢 请输入出版社：", currentPublisher);
  if (publisher === null) return;

  const stock = prompt("📦 请输入库存数量：", currentStock);
  if (stock === null) return;

  const available_stock = prompt("📗 请输入可借数量：", currentAvailable);
  if (available_stock === null) return;

  const summary = prompt("📝 请输入简介（可留空）：", currentSummary);
  if (summary === null) return;

  const image_url = prompt("🖼 请输入封面图片URL（可留空）：", currentImage);
  if (image_url === null) return;

  // 简单校验
  if (!title || !author || !publisher) {
    alert("❌ 请填写完整信息");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/books/update?id=${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        author,
        publisher,
        stock: parseInt(stock) || 0,
        available_stock: parseInt(available_stock) || 0,
        summary,
        image_url
      })
    });
    const data = await res.json();

    if (data.errno === 0) {
      alert("✅ 修改成功！");
      closeModal();
      loadBooksByCategories(currentCategoryIds, currentPage);
    } else {
      alert("❌ 修改失败：" + data.errmsg);
    }
  } catch (err) {
    console.error(err);
    alert("服务器错误，修改失败");
  }
}


// ========================
// 🗑 删除书籍
// ========================
async function deleteBook() {
  const modal = document.getElementById("bookModal");
  const bookId = modal.dataset.bookId;

  if (!bookId) {
    alert("无法识别书籍 ID");
    return;
  }

  if (!confirm("确定删除这本书吗？")) return;

  try {
    const res = await fetch(`${API_BASE}/books/delete?id=${bookId}`, {
      method: "DELETE"
    });
    const data = await res.json();

    if (data.errno === 0) {
      alert("删除成功！");
      closeModal();
      loadBooksByCategories(currentCategoryIds, currentPage);
    } else {
      alert("删除失败：" + data.errmsg);
    }
  } catch (err) {
    console.error(err);
    alert("服务器错误，删除失败");
  }
}



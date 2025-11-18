var API_BASE = "https://jzh678.icu"
// var API_BASE = "http://localhost:8360";

// 页面加载时获取所有借阅记录
window.onload = () => {
    loadAllRecords();
    document.getElementById("searchBtn").addEventListener("click", searchBookRecords);
    document.getElementById("refreshBtn").addEventListener("click", loadAllRecords);
};

// ==========================
// 📜 加载所有借阅记录
// ==========================
async function loadAllRecords() {
    const tbody = document.getElementById("recordsBody");
    tbody.innerHTML = `<tr><td colspan="7" class="loading">加载中...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/record/all`);
        const data = await res.json();

        if (data.errno === 0) {
            renderRecords(data.data);
        } else {
            tbody.innerHTML = `<tr><td colspan="7">❌ 加载失败：${data.errmsg}</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7">⚠️ 服务器错误</td></tr>`;
    }
}

// ==========================
// 🔍 查询一本书被谁借过
// ==========================
async function searchBookRecords() {
    const bookId = document.getElementById("bookIdInput").value.trim();
    if (!bookId) {
        showAlert("请输入书籍ID");
        return;
    }

    const tbody = document.getElementById("recordsBody");
    tbody.innerHTML = `<tr><td colspan="7" class="loading">正在查询...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/record/book?book_id=${bookId}`);
        const data = await res.json();

        if (data.errno === 0) {
            const list = data.data.records;
            if (!list || list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7">暂无该书的借阅记录</td></tr>`;
                return;
            }
            renderRecords(list);
        } else {
            tbody.innerHTML = `<tr><td colspan="7">❌ 查询失败：${data.errmsg}</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7">⚠️ 网络错误</td></tr>`;
    }
}

// ==========================
// 📋 渲染借阅记录
// ==========================
function renderRecords(list) {
    const tbody = document.getElementById("recordsBody");
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">暂无借阅记录</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(r => `
    <tr>
      <td>${r.book_title || '未知书籍'}</td>
      <td>${r.user_name || '未知用户'}</td>
      <td>${r.start_time || '-'}</td>
      <td>${r.end_time || '-'}</td>
      <td class="${r.is_return == 1 ? 'status-returned' : 'status-borrowed'}">
        ${r.is_return == 1 ? '✅ 已归还' : '📕 未归还'}
      </td>
    </tr>
  `).join("");
}

// ==========================
// ✅ 简易 Toast 提示
// ==========================
function showAlert(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

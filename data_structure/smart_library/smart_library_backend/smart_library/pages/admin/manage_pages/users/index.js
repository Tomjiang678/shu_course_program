var API_BASE = "http://jzh678.icu/backend";
// var API_BASE = "http://localhost:8360";
let editingUserId = null;

// 页面初始化
window.onload = () => {
    loadUsers();
    document.getElementById("refreshBtn").addEventListener("click", loadUsers);
    document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "../../index.html";
    });
    document.getElementById("cancelEditBtn").addEventListener("click", closeEditModal);
    document.getElementById("saveEditBtn").addEventListener("click", saveEdit);
};

// ==========================
// 👥 加载用户列表
// ==========================
async function loadUsers() {
    const tbody = document.getElementById("userBody");
    tbody.innerHTML = `<tr><td colspan="4" class="loading">加载中...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/user`);
        const data = await res.json();

        if (data.errno === 0) {
            const list = data.data || [];
            if (!list.length) {
                tbody.innerHTML = `<tr><td colspan="4">暂无用户</td></tr>`;
                return;
            }

            tbody.innerHTML = list.map(u => `
        <tr>
          <td>${u.user_id}</td>
          <td>${u.user_name}</td>
          <td>${u.user_password || '-'}</td>
          <td>
            <button class="action-btn view-btn" onclick="viewRecords(${u.user_id})">📖 记录</button>
            <button class="action-btn edit-btn" onclick="openEditModal(${u.user_id}, '${u.user_name}')">✏️ 修改</button>
            <button class="action-btn delete-btn" onclick="deleteUser(${u.user_id})">🗑 删除</button>
          </td>
        </tr>
      `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="4">❌ 加载失败：${data.errmsg}</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="4">⚠️ 网络错误</td></tr>`;
    }
}

// ==========================
// ✏️ 打开编辑框
// ==========================
function openEditModal(user_id, user_name, email) {
    editingUserId = user_id;
    document.getElementById("editName").value = user_name;
    document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
    editingUserId = null;
    document.getElementById("editModal").classList.add("hidden");
}

// ==========================
// 💾 保存修改
// ==========================
async function saveEdit() {
    const user_name = document.getElementById("editName").value.trim();

    if (!user_name) return alert("用户名不能为空！");

    try {
        const res = await fetch(`${API_BASE}/user/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: editingUserId,
                user_name
            })
        });

        const data = await res.json();
        if (data.errno === 0) {
            alert("修改成功！");
            closeEditModal();
            loadUsers();
        } else {
            alert(data.errmsg || "修改失败");
        }
    } catch (err) {
        console.error(err);
        alert("服务器错误");
    }
}

// ==========================
// 🗑 删除用户
// ==========================
async function deleteUser(user_id) {
    if (!confirm("确定要删除该用户吗？此操作不可恢复！")) return;

    try {
        const res = await fetch(`${API_BASE}/user/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id })
        });

        const data = await res.json();
        if (data.errno === 0) {
            alert("删除成功！");
            loadUsers();
        } else {
            alert(data.errmsg || "删除失败");
        }
    } catch (err) {
        console.error(err);
        alert("服务器错误");
    }
}

// ==========================
// 📖 查看借阅记录
// ==========================
async function viewRecords(user_id) {
    try {
        const res = await fetch(`${API_BASE}/record/user?user_id=${user_id}`);
        const result = await res.json();

        if (result.errno !== 0) return alert(result.errmsg || "加载借阅记录失败");

        const records = result.data || [];
        if (!records.length) return alert("该用户暂无借阅记录");

        const tbody = document.getElementById("recordTableBody");
        tbody.innerHTML = records.map(r => `
      <tr>
        <td>${r.book_title || '未知书籍'}</td>
        <td>${r.start_time || '-'}</td>
        <td>${r.end_time || '-'}</td>
        <td>${r.is_return ? '✅ 已归还' : '📕 未归还'}</td>
      </tr>
    `).join('');

        document.getElementById("recordModal").classList.remove("hidden");
    } catch (err) {
        console.error("查看借阅记录失败:", err);
        alert("服务器错误");
    }
}

function closeRecordModal() {
    document.getElementById("recordModal").classList.add("hidden");
}


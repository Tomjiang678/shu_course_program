var API_BASE = "https://jzh678.icu"
// var API_BASE = "http://localhost:8360";
let editingId = null;
let allCategories = [];

// 页面加载
window.onload = () => {
    loadCategories();
    document.getElementById("addCategoryBtn").addEventListener("click", () => openModal());
    document.getElementById("refreshBtn").addEventListener("click", loadCategories);
    document.getElementById("backBtn").addEventListener("click", () => window.location.href = "../../index.html");
    document.getElementById("cancelEditBtn").addEventListener("click", closeModal);
    document.getElementById("saveEditBtn").addEventListener("click", saveCategory);
};

// ====================
// 📋 加载分类
// ====================
async function loadCategories() {
    const tbody = document.getElementById("categoryBody");
    tbody.innerHTML = `<tr><td colspan="5">加载中...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/categories/all`);
        const data = await res.json();

        if (data.errno !== 0) {
            tbody.innerHTML = `<tr><td colspan="5">❌ ${data.errmsg}</td></tr>`;
            return;
        }

        allCategories = data.data || [];

        if (!allCategories.length) {
            tbody.innerHTML = `<tr><td colspan="5">暂无分类</td></tr>`;
            return;
        }

        // 渲染一级与二级分类
        tbody.innerHTML = allCategories.map(cat => {
            const childRows = (cat.children || []).map(sub => `
        <tr class="child-row">
          <td>${sub.category_id}</td>
          <td>└ ${sub.name}</td>
          <td>${sub.description || '-'}</td>
          <td>二级</td>
          <td>
            <button class="action-btn edit-btn" onclick="openModal(${sub.id}, '${sub.name}', '${sub.description || ''}', ${cat.id})">✏️ 修改</button>
            <button class="action-btn delete-btn" onclick="deleteCategory(${sub.id})">🗑 删除</button>
          </td>
        </tr>
      `).join('');

            return `
        <tr>
          <td>${cat.category_id}</td>
          <td>${cat.name}</td>
          <td>${cat.description || '-'}</td>
          <td>一级</td>
          <td>
            <button class="action-btn edit-btn" onclick="openModal(${cat.id}, '${cat.name}', '${cat.description || ''}', 0)">✏️ 修改</button>
            <button class="action-btn delete-btn" onclick="deleteCategory(${cat.id})">🗑 删除</button>
          </td>
        </tr>
        ${childRows}
      `;
        }).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5">⚠️ 网络错误</td></tr>`;
    }
}

// ====================
// 🪟 打开模态框
// ====================
function openModal(id = null, name = "", desc = "", parent_id = 0) {
    editingId = id;

    document.getElementById("editName").value = name;
    document.getElementById("editDesc").value = desc;
    document.getElementById("modalTitle").textContent = id ? "✏️ 编辑分类" : "➕ 新增分类";

    // 下拉框
    const select = document.getElementById("parentSelect");
    select.innerHTML = `<option value="0">（无上级分类）</option>`;
    allCategories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}" ${parent_id === cat.id ? 'selected' : ''}>${cat.name}</option>`;
    });

    document.getElementById("editModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("editModal").classList.add("hidden");
    editingId = null;
}

// ====================
// 💾 保存分类
// ====================
async function saveCategory() {
    const name = document.getElementById("editName").value.trim();
    const description = document.getElementById("editDesc").value.trim();
    const parent_id = parseInt(document.getElementById("parentSelect").value);

    if (!name) return alert("分类名称不能为空！");

    const url = editingId ? `${API_BASE}/categories/update` : `${API_BASE}/categories/create`;
    const body = editingId
        ? { id: editingId, name, description }
        : { name, parent_id, description };

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.errno === 0) {
            alert("✅ 操作成功！");
            closeModal();
            loadCategories();
        } else {
            alert(`❌ ${data.errmsg}`);
        }
    } catch (err) {
        console.error(err);
        alert("服务器错误");
    }
}

// ====================
// 🗑 删除分类
// ====================
async function deleteCategory(id) {
    if (!confirm("确定要删除该分类吗？若为一级分类将级联删除其子分类！")) return;

    try {
        const res = await fetch(`${API_BASE}/categories/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        });
        const data = await res.json();

        if (data.errno === 0) {
            alert("🗑 删除成功！");
            loadCategories();
        } else {
            alert(`❌ ${data.errmsg}`);
        }
    } catch (err) {
        console.error(err);
        alert("服务器错误");
    }
}
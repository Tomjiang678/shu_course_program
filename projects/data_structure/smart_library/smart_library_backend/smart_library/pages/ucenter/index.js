var API_BASE = "http://jzh678.icu/backend";
// var API_BASE = "http://localhost:8360";

let isRegisterMode = false;
let showAllReturns = false;
// ======================
// 🧩 登录 / 注册切换逻辑
// ======================
document.getElementById('toggle-mode').onclick = function () {
  isRegisterMode = !isRegisterMode;
  document.getElementById('auth-title').textContent = isRegisterMode ? '注册' : '登录';
  document.getElementById('submit-btn').textContent = isRegisterMode ? '注册' : '登录';
  this.textContent = isRegisterMode ? '已有账号？去登录' : '没有账号？注册一个';
};

// ======================
// 🔐 登录 / 注册提交逻辑
// ======================
document.getElementById('login-form').onsubmit = async function (e) {
  e.preventDefault();

  const user_name = document.getElementById('username').value.trim();
  const user_password = document.getElementById('password').value.trim();

  if (!user_name || user_name.length < 3) return alert('用户名至少3个字符');
  if (!user_password || user_password.length < 6) return alert('密码至少6位');

  const endpoint = isRegisterMode ? '/user/register' : '/user/login';
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name, user_password })
  });
  const data = await res.json();

  if (data.errno === 0) {
    if (isRegisterMode) {
      alert('注册成功，请登录！');
      document.getElementById('toggle-mode').click();
    } else {
      localStorage.setItem('user', JSON.stringify(data.data));
      showCenter(data.data.user_name);
      loadRecords(); // 登录后立即加载借阅记录
    }
  } else {
    alert(data.errmsg || (isRegisterMode ? '注册失败' : '用户名或密码错误'));
  }
};

// ======================
// 👤 显示用户中心
// ======================
function showCenter(username) {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('center-section').classList.remove('hidden');
  document.getElementById('user-name').textContent = username;
}

// ======================
// 📜 加载借阅 / 归还记录
// ======================
async function loadRecords() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return;

  try {
    const res = await fetch(`${API_BASE}/borrow/records?user_id=${user.user_id}`);
    const result = await res.json();

    if (result.errno === 0) {
      fillTables(result.data);
    } else {
      fillTables({ borrowList: [], returnList: [] });
      alert(result.errmsg || "加载借阅记录失败");
    }
  } catch (err) {
    console.error("获取借阅记录失败:", err);
    fillTables({ borrowList: [], returnList: [] });
  }
}

// ======================
// 🧾 填充表格（新增归还 + 续借按钮）
// ======================
function fillTables(records) {
  const borrowTbody = document.querySelector('#borrow-table tbody');
  const returnTbody = document.querySelector('#return-table tbody');

  const borrowList = records.borrowList || [];
  const returnList = records.returnList || [];

  borrowTbody.innerHTML = borrowList.length
    ? borrowList.map(r => `
      <tr>
        <td>${r.book_title}</td>
        <td>${r.start_time}</td>
        <td>
          借阅中（到期：${r.end_time}）
          <button class="return-btn" onclick="returnBook(${r.book_id})">归还</button>
          <button class="renew-btn" onclick="renewBook(${r.book_id})">续借</button>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="3">暂无借阅记录</td></tr>';

  // ✅ 归还记录（默认显示5条）
  const sortedReturns = returnList.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
  const displayList = showAllReturns ? sortedReturns : sortedReturns.slice(0, 5);

  returnTbody.innerHTML = displayList.length
    ? displayList.map(r => `
      <tr>
        <td>${r.book_title}</td>
        <td>${r.start_time}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="2">暂无归还记录</td></tr>';

  // ✅ 添加展开按钮
  if (sortedReturns.length > 5) {
    const expandRow = document.createElement('tr');
    expandRow.innerHTML = `
      <td colspan="2" style="text-align:center;">
        <button class="expand-btn" id="toggleReturnBtn">
          ${showAllReturns ? '收起记录 ▲' : '展开更多 ▼'}
        </button>
      </td>
    `;
    returnTbody.appendChild(expandRow);

    document.getElementById('toggleReturnBtn').onclick = () => {
      showAllReturns = !showAllReturns;
      fillTables(records);
    };
  }
}

// ======================
// 🔁 归还逻辑
// ======================
async function returnBook(book_id) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return alert("请先登录！");

  if (!confirm("确定要归还这本书吗？")) return;

  try {
    const res = await fetch(`${API_BASE}/borrow/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.user_id,
        book_id
      })
    });

    const data = await res.json();
    if (data.errno === 0) {
      alert("归还成功！");
      loadRecords(); // 重新加载记录
    } else {
      alert(data.errmsg || "归还失败");
    }
  } catch (err) {
    console.error(err);
    alert("服务器错误，归还失败");
  }
}

// ======================
// 🔄 新增续借逻辑
// ======================
async function renewBook(book_id) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return alert("请先登录！");

  if (!confirm("确定要续借这本书30天吗？")) return;

  try {
    const res = await fetch(`${API_BASE}/borrow/renew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.user_id,
        book_id
      })
    });

    const data = await res.json();
    if (data.errno === 0) {
      alert("续借成功，期限已延长30天！");
      loadRecords(); // 重新加载记录
    } else {
      alert(data.errmsg || "续借失败");
    }
  } catch (err) {
    console.error(err);
    alert("服务器错误，续借失败");
  }
}

// ======================
// 🚪 登出
// ======================
function logout() {
  localStorage.removeItem('user');
  document.getElementById('center-section').classList.add('hidden');
  document.getElementById('auth-section').classList.remove('hidden');
  document.getElementById('login-form').reset();
}

// ======================
// ⚙️ 自动登录检测
// ======================
const savedUser = localStorage.getItem('user');
if (savedUser) {
  const user = JSON.parse(savedUser);
  showCenter(user.user_name);
  loadRecords();
}

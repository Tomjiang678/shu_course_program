var API_BASE = "https://jzh678.icu"
// var API_BASE = "http://localhost:8360";
let isRegisterMode = false;

// ✅ 切换登录/注册模式
document.getElementById('toggle-mode').onclick = function () {
  isRegisterMode = !isRegisterMode;
  document.getElementById('auth-title').textContent = isRegisterMode ? '注册' : '登录';
  document.getElementById('submit-btn').textContent = isRegisterMode ? '注册' : '登录';
  this.textContent = isRegisterMode ? '已有账号？去登录' : '没有账号？注册一个';
};

// ✅ 登录/注册表单提交事件
document.getElementById('login-form').onsubmit = async function (e) {
  e.preventDefault();

  const user_name = document.getElementById('username').value.trim();
  const user_password = document.getElementById('password').value.trim();

  if (!user_name || user_name.length < 3) return showAlert('用户名至少3个字符');
  if (!user_password || user_password.length < 6) return showAlert('密码至少6位');

  const endpoint = isRegisterMode ? '/user/register' : '/user/login';
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name, user_password })
  });

  const data = await res.json();
  if (data.errno === 0) {
    if (isRegisterMode) {
      showAlert('注册成功，请登录！');
      document.getElementById('toggle-mode').click();
    } else {
      localStorage.setItem('user', JSON.stringify(data.data));
      showAlert(`登录成功！欢迎 ${data.data.user_name}`);
    }
  } else {
    showAlert(data.errmsg || (isRegisterMode ? '注册失败' : '用户名或密码错误'));
  }
};

// ✅ 自动登录检测
const savedUser = localStorage.getItem('user');
if (savedUser) {
  const user = JSON.parse(savedUser);
}


// ✅ 首页推荐书籍（借阅次数最高的3本）
async function loadTopBooks() {
  try {
    const res = await fetch(`${API_BASE}/books?sort=borrow_count&page=1`);
    const result = await res.json();

    let list = [];
    if (result.errno === 0) {
      const data = result.data;
      if (Array.isArray(data?.list)) list = data.list;
      else if (Array.isArray(data)) list = data;
    }

    const top3 = list.slice(0, 3);
    const container = document.getElementById('recommendList');

    if (top3.length === 0) {
      container.innerHTML = '<p>暂无推荐书籍</p>';
      return;
    }

    container.innerHTML = top3.map(book => {
      const img = book.image_url || 'assets/img/fallback.jpg';
      const title = book.title || '未命名';
      const author = book.author || '佚名';
      const borrow = book.borrow_count || 0;
      const href = `pages/books/index.html?id=${book.id}`;
      return `
        <div class="book" onclick="showBookDetail(${book.id})" style="cursor:pointer; text-align:center;">
          <img src="${img}" alt="${title}" style="width:120px;height:160px;object-fit:cover;border-radius:4px;" onerror="this.src='assets/img/fallback.jpg'">
          <div style="margin-top:6px;font-weight:600;">${title}</div>
          <div style="color:#666;font-size:13px;margin-top:4px;">${author}</div>
          <div style="color:#999;font-size:12px;margin-top:4px;">借阅：${borrow}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("加载推荐书籍失败：", err);
    document.getElementById('recommendList').innerHTML = '<p>加载失败</p>';
  }
}


// ✅ 页面加载时调用
window.addEventListener('DOMContentLoaded', () => {
  loadTopBooks();
});



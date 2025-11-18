// ==============================
// 👮 管理员登录
// ==============================
function checkLogin() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");
    const loginBox = document.querySelector(".login-box");
    const dashboard = document.getElementById("dashboard");

    if (user === "admin" && pass === "123456") {
        msg.textContent = "✅ 登录成功！";
        msg.className = "msg success";
        msg.style.display = "block";

        // ✅ 保存登录状态到 localStorage
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminName", user);

        setTimeout(() => {
            loginBox.style.display = "none";
            dashboard.style.display = "block";
        }, 800);
    } else {
        msg.textContent = "❌ 账号或密码错误，请重试。";
        msg.className = "msg error";
        msg.style.display = "block";
    }
}

// ==============================
// 🚪 退出登录
// ==============================
function logout() {
    // 清除 localStorage
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminName");

    // 恢复到登录界面
    document.querySelector(".login-box").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("msg").style.display = "none";
}

// ==============================
// 🌐 页面加载时自动登录检测
// ==============================
window.onload = () => {
    const loggedIn = localStorage.getItem("adminLoggedIn");
    if (loggedIn === "true") {
        document.querySelector(".login-box").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
    }
};

// ==============================
// 📂 打开模块页面
// ==============================
function openModule(module) {
    const url = `manage_pages/${module}/index.html`;
    window.location.href = url;
}

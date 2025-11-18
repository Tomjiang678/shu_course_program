// ✅ 通用提示函数（toast）
function showAlert(message, duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  // 动画出现
  setTimeout(() => toast.classList.add('show'), 50);

  // 自动消失
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => container.removeChild(toast), 300);
  }, duration);}
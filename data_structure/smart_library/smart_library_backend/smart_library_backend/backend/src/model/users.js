module.exports = class extends think.Model {
  /**
   * 🧍 根据用户名获取用户信息
   * @param {string} user_name - 用户名
   */
  async getUserByName(user_name) {
    return this.where({ user_name }).find();
  }

  /**
   * 🆕 创建新用户（user_id 自动递增）
   * @param {string} user_name - 用户名
   * @param {string} user_password - 密码
   */
  async createUser(user_name, user_password) {
    return this.add({ user_name, user_password });
  }

  /**
   * 📋 获取所有用户
   */
  async getAllUsers() {
    return this.select();
  }

  /**
   * ❌ 删除用户
   * @param {number} user_id - 用户ID
   */
  async deleteUser(user_id) {
    return this.where({ user_id }).delete();
  }

  /**
   * ✏️ 更新用户信息（可修改用户名或密码）
   * @param {number} user_id - 用户ID
   * @param {object} data - 要更新的字段 { user_name?, user_password? }
   */
  async updateUser(user_id, data) {
    return this.where({ user_id }).update(data);
  }

  /**
   * 🔍 根据ID获取用户
   * @param {number} user_id - 用户ID
   */
  async getUserById(user_id) {
    return this.where({ user_id }).find();
  }
};

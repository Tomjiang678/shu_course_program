const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * GET /user
   * 获取所有用户
   */
  async indexAction() {
    const list = await this.model('users').getAllUsers();
    return this.success(list);
  }

  /**
   * POST /user/login
   * 用户登录
   */
  async loginAction() {
    const { user_name, user_password } = this.post();

    if (!user_name || !user_password) {
      return this.fail(400, '用户名或密码不能为空');
    }

    const user = await this.model('users').getUserByName(user_name);
    if (think.isEmpty(user)) {
      return this.fail(404, '用户不存在');
    }

    if (user.user_password !== user_password) {
      return this.fail(401, '密码错误');
    }

    return this.success({
      user_id: user.user_id,
      user_name: user.user_name
    });
  }

  /**
   * POST /user/register
   * 用户注册
   */
  async registerAction() {
    const { user_name, user_password } = this.post();

    if (!user_name || !user_password) {
      return this.fail(400, '用户名或密码不能为空');
    }

    const exist = await this.model('users').getUserByName(user_name);
    if (!think.isEmpty(exist)) {
      return this.fail(409, '用户名已存在');
    }

    const id = await this.model('users').createUser(user_name, user_password);
    return this.success({ id, user_name });
  }
/**
   * POST /user/update
   * 管理员修改用户信息
   */
  async updateAction() {
    const { user_id, user_name, user_password } = this.post();

    if (!user_id) return this.fail(400, '缺少 user_id');
    if (!user_name && !user_password) {
      return this.fail(400, '请提供需要更新的字段');
    }

    const userModel = this.model('users');
    const user = await userModel.where({ user_id }).find();

    if (think.isEmpty(user)) return this.fail(404, '用户不存在');

    const updateData = {};
    if (user_name) updateData.user_name = user_name;
    if (user_password) updateData.user_password = user_password;

    await userModel.where({ user_id }).update(updateData);

    return this.success('用户信息已更新');
  }

  /**
   * POST /user/delete
   * 管理员删除用户
   */
  async deleteAction() {
    const { user_id } = this.post();

    if (!user_id) return this.fail(400, '缺少 user_id');

    const affected = await this.model('users').where({ user_id }).delete();
    if (affected) {
      return this.success('删除成功');
    } else {
      return this.fail(404, '用户不存在');
    }
  }
};


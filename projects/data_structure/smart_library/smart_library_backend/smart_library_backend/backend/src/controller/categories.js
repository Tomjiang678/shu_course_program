const Base = require('./base.js');

/**
 * 📚 图书分类管理控制器
 * 支持：查询 / 新增 / 修改 / 删除（含级联）
 */
module.exports = class extends Base {

  async indexAction() {
    // 查询所有分类
    const categories = await this.model('book_categories').select();

    // 返回 JSON
    return this.success(categories);
  }
  /**
   * GET /categories/all
   * 查询所有分类（按层级返回）
   */
  async allAction() {
    try {
      const list = await this.model('book_categories').order('category_id ASC').select();

      // 构造树形结构
      const topLevel = list.filter(c => c.parent_id === 0);
      const result = topLevel.map(cat => ({
        ...cat,
        children: list.filter(sub => sub.parent_id === cat.id)
      }));

      return this.success(result);
    } catch (err) {
      console.error('❌ 获取分类失败:', err);
      return this.fail('获取分类失败', { error: err.message });
    }
  }

  /**
   * POST /categories/create
   * 新增分类（自动生成 category_id）
   */
  async createAction() {
    try {
      const { name, parent_id = 0, description = '' } = this.post();
      if (!name) return this.fail(400, '分类名称不能为空');

      const model = this.model('book_categories');
      let category_id;

      if (parseInt(parent_id) === 0) {
        // 一级分类 → 1000001 开始
        const count = await model.where({ parent_id: 0 }).count();
        category_id = 1000000 + (count + 1);
      } else {
        // 二级分类 → 200XXYY
        const parent = await model.where({ id: parent_id }).find();
        if (think.isEmpty(parent)) return this.fail(404, '上级分类不存在');

        const count = await model.where({ parent_id }).count();
        const parentSeq = parent.category_id.toString().slice(-2).padStart(2, '0');
        category_id = parseInt(`200${parentSeq}${(count + 1).toString().padStart(2, '0')}`);
      }

      const id = await model.add({
        name,
        description,
        parent_id,
        category_id
      });

      return this.success({ id, category_id, name });
    } catch (err) {
      console.error('❌ 新增分类失败:', err);
      return this.fail('新增分类失败', { error: err.message });
    }
  }

  /**
   * POST /categories/update
   * 修改分类信息
   */
  async updateAction() {
    try {
      const { id, name, description } = this.post();
      if (!id) return this.fail(400, '缺少分类 ID');
      if (!name) return this.fail(400, '分类名称不能为空');

      const model = this.model('book_categories');
      const cat = await model.where({ id }).find();
      if (think.isEmpty(cat)) return this.fail(404, '分类不存在');

      await model.where({ id }).update({ name, description });
      return this.success('分类已更新');
    } catch (err) {
      console.error('❌ 修改分类失败:', err);
      return this.fail('修改分类失败', { error: err.message });
    }
  }

  /**
   * POST /categories/delete
   * 删除分类（级联删除二级分类）
   */
  async deleteAction() {
    try {
      const { id } = this.post();
      if (!id) return this.fail(400, '缺少分类 ID');

      const model = this.model('book_categories');
      const cat = await model.where({ id }).find();
      if (think.isEmpty(cat)) return this.fail(404, '分类不存在');

      // 如果是一级分类，级联删除二级分类
      if (cat.parent_id === 0) {
        await model.where({ parent_id: id }).delete();
      }

      await model.where({ id }).delete();
      return this.success('分类删除成功');
    } catch (err) {
      console.error('❌ 删除分类失败:', err);
      return this.fail('删除分类失败', { error: err.message });
    }
  }
};

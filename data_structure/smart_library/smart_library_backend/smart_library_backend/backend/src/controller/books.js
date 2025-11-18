const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 📚 获取书籍列表（带分页 + 分类筛选 + 排序）
   * 示例：
   *   GET /books?page=1&category_id=1,2&sort=borrow_count
   */
  async indexAction() {
    try {
      // 获取查询参数
      const page = parseInt(this.get('page')) || 1;
      const pageSize = 10;
      const categoryIds = this.get('category_id')
        ? this.get('category_id').split(',').map(Number)
        : [];
      const sortField = this.get('sort'); // 排序字段

      const model = this.model('books');

      // 分类过滤
      if (categoryIds.length > 0) {
        model.where({ category_id: ['IN', categoryIds] });
      }

      // 排序逻辑（默认按 id 升序）
      if (['borrow_count', 'stock', 'available_stock'].includes(sortField)) {
        model.order(`${sortField} DESC`);
      } else {
        model.order('id ASC');
      }

      // 分页查询
      const data = await model.page(page, pageSize).countSelect();

      // 返回结果
      return this.success({
        list: data.data,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      });
    } catch (err) {
      return this.fail('获取书籍列表失败', { error: err.message });
    }
  }

  /**
   * 📖 获取单本书详情
   * 示例：
   *   GET /books/detail?id=123
   */
  async detailAction() {
    try {
      const id = this.get('id');
      if (!id) return this.fail('缺少参数 id');

      const book = await this.model('books').where({ id }).find();
      if (think.isEmpty(book)) {
        return this.fail('未找到该书');
      }

      return this.success(book);
    } catch (err) {
      return this.fail('获取书籍详情失败', { error: err.message });
    }
  }
/**
   * 🆕 新增图书
   * POST /books/create
   * body: { isbn, title, author, publisher, category_id, summary, stock, available_stock, image_url }
   */
  async createAction() {
    try {
      const {
        isbn,
        title,
        author,
        publisher,
        category_id,
        summary,
        stock,
        available_stock,
        image_url
      } = this.post();

      if (!isbn || !title || !author || !publisher || !category_id) {
        return this.fail('缺少必要字段');
      }

      const insertId = await this.model('books').add({
        isbn,
        title,
        author,
        publisher,
        category_id,
        summary: summary || '',
        stock: parseInt(stock) || 0,
        available_stock: parseInt(available_stock) || parseInt(stock) || 0,
        borrow_count: 0,
        image_url: image_url || '',
      });

      return this.success({ id: insertId, message: '新增成功' });
    } catch (err) {
      return this.fail('新增失败', { error: err.message });
    }
  }

  /**
   * ✏️ 修改图书
   * PUT /books/update?id=xxx
   * body: { title?, author?, publisher?, category_id?, summary?, stock?, available_stock?, image_url? }
   */
  async updateAction() {
    try {
      const id = this.get('id');
      if (!id) return this.fail('缺少参数 id');

      const data = this.post();
      // 过滤非法字段
      const allowedFields = [
        'isbn', 'title', 'author', 'publisher', 'category_id',
        'summary', 'stock', 'available_stock', 'image_url'
      ];
      const updateData = {};
      for (const key of allowedFields) {
        if (data[key] !== undefined && data[key] !== null) {
          updateData[key] = data[key];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return this.fail('没有可更新的字段');
      }

      const affected = await this.model('books').where({ id }).update(updateData);
      return this.success({ affected, message: '更新成功' });
    } catch (err) {
      return this.fail('更新失败', { error: err.message });
    }
  }

  /**
   * 🗑 删除图书
   * DELETE /books/delete?id=xxx
   */
  async deleteAction() {
    try {
      const id = this.get('id');
      if (!id) return this.fail('缺少参数 id');

      const affected = await this.model('books').where({ id }).delete();
      if (affected === 0) return this.fail('未找到对应图书');

      return this.success({ affected, message: '删除成功' });
    } catch (err) {
      return this.fail('删除失败', { error: err.message });
    }
  }
};

const Base = require('./base.js');

/**
 * 📚 管理员 - 借阅记录管理
 */
module.exports = class extends Base {

  /**
   * 🧾 获取所有借阅记录（管理员查看）
   * GET /record/all
   */
  async allAction() {
    try {
      const borrowModel = this.model('borrow_records');
      const bookModel = this.model('books');
      const userModel = this.model('users');

      // ⚙️ 没有 id 主键，用 start_time 排序
      const records = await borrowModel.order('start_time DESC').select();

      for (const record of records) {
        const book = await bookModel.where({ id: record.book_id }).find();
        const user = await userModel.where({ user_id: record.user_id }).find();

        record.book_title = (book && book.title) ? book.title : '未知书籍';
        record.user_name = (user && user.user_name) ? user.user_name : '未知用户';
      }

      return this.success(records);
    } catch (err) {
      console.error('❌ 获取借阅记录失败:', err);
      return this.fail('获取借阅记录失败', { error: err.message });
    }
  }

  /**
   * 📜 查询某个用户的借阅记录
   * GET /record/user?user_id=xxx
   */
  async userAction() {
    try {
      const user_id = this.get('user_id');
      if (!user_id) return this.fail('缺少用户ID');

      const borrowModel = this.model('borrow_records');
      const bookModel = this.model('books');

      const records = await borrowModel.where({ user_id }).order('start_time DESC').select();

      for (const record of records) {
        const book = await bookModel.where({ id: record.book_id }).find();
        record.book_title = (book && book.title) ? book.title : '未知书籍';
      }

      return this.success(records);
    } catch (err) {
      console.error('❌ 获取用户借阅记录失败:', err);
      return this.fail('获取用户借阅记录失败', { error: err.message });
    }
  }

  /**
   * 🔍 查询一本书被谁借过（包括已归还和未归还）
   * GET /record/book?book_id=xxx
   */
  async bookAction() {
    try {
      const book_id = this.get('book_id');
      if (!book_id) return this.fail('缺少书籍ID');

      const borrowModel = this.model('borrow_records');
      const userModel = this.model('users');
      const bookModel = this.model('books');

      const book = await bookModel.where({ id: book_id }).find();
      if (think.isEmpty(book)) return this.fail('书籍不存在');

      const records = await borrowModel.where({ book_id }).order('start_time DESC').select();

      // 拼接借阅者信息
      for (const record of records) {
        const user = await userModel.where({ user_id: record.user_id }).find();
        record.user_name = (user && user.user_name) ? user.user_name : '未知用户';
        record.book_title = book.title;
      }

      return this.success({
        book_title: book.title,
        total_times: records.length,
        records
      });
    } catch (err) {
      console.error('❌ 查询书籍借阅记录失败:', err);
      return this.fail('查询书籍借阅记录失败', { error: err.message });
    }
  }
};



const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 📚 借阅图书
   * POST /borrow/add
   * 参数：user_id, book_id
   */
  async addAction() {
    try {
      const { user_id, book_id } = this.post();
      if (!user_id || !book_id) return this.fail('缺少必要参数');

      // 检查书籍
      const book = await this.model('books').where({ id: book_id }).find();
      if (think.isEmpty(book)) return this.fail('书籍不存在');
      if (book.available_stock <= 0) return this.fail('库存不足');

      // 限制最多借5本未归还书
      const count = await this.model('borrow_records')
        .where({ user_id, is_return: 0 })
        .count();
      if (count >= 5) return this.fail('最多同时借阅5本书，请先归还');

      // 检查是否已借相同书未归还
      const exist = await this.model('borrow_records')
        .where({ user_id, book_id, is_return: 0 })
        .find();
      if (!think.isEmpty(exist)) return this.fail('该书已借阅且未归还');

      // 插入新记录（30天期限）
      const start = think.datetime(new Date(), 'YYYY-MM-DD');
      const end = think.datetime(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'YYYY-MM-DD'
      );

      await this.model('borrow_records').add({
        user_id,
        book_id,
        start_time: start,
        end_time: end,
        is_return: 0
      });

      // 更新库存与借阅次数
      await this.model('books')
        .where({ id: book_id })
        .update({
          available_stock: book.available_stock - 1,
          borrow_count: book.borrow_count + 1
        });

      return this.success('借阅成功');
    } catch (err) {
      console.error(err);
      return this.fail('借阅失败', { error: err.message });
    }
  }

  /**
   * 📖 归还图书
   * POST /borrow/return
   */
  async returnAction() {
    try {
      const { user_id, book_id } = this.post();
      if (!user_id || !book_id) return this.fail('缺少必要参数');

      const record = await this.model('borrow_records')
        .where({ user_id, book_id, is_return: 0 })
        .find();
      if (think.isEmpty(record)) return this.fail('未找到未归还记录');

      // 标记归还
      await this.model('borrow_records')
        .where({ user_id, book_id, is_return: 0 })
        .update({ is_return: 1 });

      // 库存+1
      await this.model('books')
        .where({ id: book_id })
        .increment('available_stock', 1);

      return this.success('归还成功');
    } catch (err) {
      console.error(err);
      return this.fail('归还失败', { error: err.message });
    }
  }

  /**
   * 🔁 续借图书（延长30天）
   * POST /borrow/renew
   */
  async renewAction() {
    try {
      const { user_id, book_id } = this.post();
      if (!user_id || !book_id) return this.fail('缺少必要参数');

      const record = await this.model('borrow_records')
        .where({ user_id, book_id, is_return: 0 })
        .find();
      if (think.isEmpty(record)) return this.fail('未找到未归还记录');

      // end_time + 30天
      const newEnd = think.datetime(
        new Date(new Date(record.end_time).getTime() + 30 * 24 * 60 * 60 * 1000),
        'YYYY-MM-DD'
      );

      await this.model('borrow_records')
        .where({ user_id, book_id, is_return: 0 })
        .update({ end_time: newEnd });

      return this.success('续借成功');
    } catch (err) {
      console.error(err);
      return this.fail('续借失败', { error: err.message });
    }
  }

  /**
   * 📜 获取用户借阅/归还记录
   * GET /borrow/records?user_id=xxx
   */
  async recordsAction() {
    try {
      const user_id = this.get('user_id');
      if (!user_id) return this.fail('缺少用户ID');

      const borrowModel = this.model('borrow_records');
      const bookModel = this.model('books');

      const records = await borrowModel.where({ user_id }).select();

      // 拼接书名
      for (const record of records) {
        const book = await bookModel.where({ id: record.book_id }).find();
        record.book_title = book.title || '未知书名';
      }

      const borrowList = records.filter(r => r.is_return == 0);
      const returnList = records.filter(r => r.is_return == 1);

      return this.success({ borrowList, returnList });
    } catch (err) {
      console.error(err);
      return this.fail('获取借阅记录失败', { error: err.message });
    }
  }
};


export default class extends think.Controller {
  async indexAction() {
    const keyword = (this.get('keyword') || '').trim();
    if (!keyword) return this.json([]);

    // ① 先查分类表
    const categories = await this.model('book_categories')
      .where({
        name: ['LIKE', `%${keyword}%`]
      })
      .select();

    if (categories.length) {
      // 找到分类，直接返回该分类下的前 5 本书
      const categoryIds = categories.map(c => c.id);
      const books = await this.model('books')
        .where({ category_id: ['IN', categoryIds] })
        .limit(5)
        .select();
      return this.json(books);
    }

    // ② 没找到分类，按书名/作者搜索
    const books = await this.model('books')
      .where({
        _complex: {
          title: ['LIKE', `%${keyword}%`],
          author: ['LIKE', `%${keyword}%`],
          _logic: 'or'
        }
      })
      .limit(5)
      .select();

    return this.json(books);
  }
}


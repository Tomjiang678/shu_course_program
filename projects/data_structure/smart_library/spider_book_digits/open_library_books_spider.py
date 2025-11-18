import requests
import pymysql
import random
import time

# ==============================
# 配置区
# ==============================

# MySQL 数据库配置（请按需修改）
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456", 
    "database": "smart_library",
    "charset": "utf8mb4"
}

# 分类及其对应关键词（使用数据库中真实的 id 值）
CATEGORIES = {
    22: "physics",
    23: "chemistry",
    24: "biology",
    25: "earth science",
    26: "astronomy",
    27: "anthropology",
    28: "urban sociology",
    29: "psychology",
    30: "ancient literature",
    31: "modern literature",
    32: "european literature",
    33: "american literature",
    34: "chinese history",
    35: "world history",
    36: "philosophy theory",
    37: "chinese philosophy",
    38: "foreign philosophy",
    39: "applied philosophy",
    40: "mechanical & manufacturing engineering",
    41: "electrical & electronic engineering",
    42: "computer & information engineering",
    43: "chemical & materials engineering",
    44: "energy & power engineering",
    45: "medical & bioengineering",
    46: "civil & architectural engineering",
    47: "basic mathematics",
    48: "applied mathematics",
    49: "probability & statistics",
    50: "computational mathematics",
    51: "logic",
    52: "clinical medicine",
    53: "basic medicine",
    54: "public & social medicine",
    55: "medical technology & applications",
    56: "traditional chinese medicine",
    57: "economics basics",
    58: "applied economics",
    59: "finance",
    60: "international trade",
    61: "business management",
    62: "public administration",
    63: "human resources management",
    64: "fine arts",
    65: "design",
    66: "music & dance",
    67: "drama & film studies",
    68: "law theory & constitution",
    69: "criminal law",
    70: "civil & commercial law",
    71: "economics & IP law",
    72: "international law",
    73: "crop science",
    74: "forestry",
    75: "horticulture",
    76: "animal husbandry & veterinary",
    77: "aquaculture",
    78: "agricultural engineering",
    79: "sports theory & education",
    80: "ball games",
    81: "athletics & fitness",
    82: "water & ice sports",
    83: "martial arts & traditional sports",
    84: "fitness & leisure sports",
    85: "religion theory & history",
    86: "eastern religions",
    87: "western religions",
    88: "political theory",
    89: "chinese & foreign politics",
    90: "international politics & public affairs",
    91: "enlightenment & picture books",
    92: "children's literature & youth books",
    93: "children's science & education",
    94: "primary school textbooks",
    95: "junior high textbooks",
    96: "high school textbooks",
    97: "college textbooks / exam prep",
    98: "vocational / adult education",
    99: "china travel",
    100: "world travel",
    101: "special travel",
    102: "architecture history & theory",
    103: "architecture design & methods",
    104: "architecture structure & technology",
    105: "urban planning & landscape design",
    106: "chinese cuisine",
    107: "western cuisine",
    108: "baking & desserts",
    109: "beverages & cocktails",
    110: "nutrition & healthy diet"
}


# 每类爬取数量
BOOKS_PER_CATEGORY = 50

# 每次请求的间隔秒数（防止被限流）
REQUEST_INTERVAL = 1


# ==============================
# 函数区
# ==============================

def get_books(keyword, page=1, limit=100):
    """调用 Open Library API 获取书籍"""
    url = f"https://openlibrary.org/search.json?q={keyword}&page={page}&limit={limit}&lang=chi"
    try:
        print(f"📡 正在请求第 {page} 页: {url}")
        response = requests.get(url, timeout=15)
        if response.status_code == 200:
            data = response.json()
            docs = data.get("docs", [])
            print(f"🔍 第 {page} 页获取到 {len(docs)} 条记录")
            return docs
        else:
            print(f"⚠️ 请求失败：{response.status_code} - {url}")
            return []
    except Exception as e:
        print(f"❌ 请求出错：{e}")
        return []


def parse_books(docs, category_id):
    """解析并生成插入数据库的书籍数据"""
    books = []
    for d in docs:
        title = d.get("title", "Unknown Title")
        author_list = d.get("author_name", ["Unknown Author"])
        author = ", ".join(author_list)

        # 过滤掉 Baby Professor
        if any("baby professor" in a.lower() for a in author_list):
            continue

        # ISBN 或 edition_key
        isbn_list = d.get("isbn") or d.get("edition_key") or []
        isbn = isbn_list[0] if isbn_list else f"NOISBN_{d.get('key','')}"

        # 出版社
        publisher = ", ".join(d.get("publisher", d.get("publisher_facet", ["Unknown Publisher"])))

        # 封面图片（跳过无 cover_i）
        cover_id = d.get("cover_i")
        if not cover_id:
            continue
        image_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"

        summary = f"{title} by {author}. A book related to {CATEGORIES[category_id]}."
        stock = 1000
        available_stock = 1000
        borrow_count = random.randint(0, 200)

        books.append((
            isbn[:100],
            title[:100],
            author[:100],
            publisher[:100],
            category_id,
            summary,
            stock,
            available_stock,
            borrow_count,
            image_url[:100]
        ))

    return books


def insert_books_to_db(cursor, books_data):
    """批量插入数据到数据库（自动跳过重复 ISBN）"""
    sql = """
    INSERT INTO smart_library_books
    (isbn, title, author, publisher, category_id, summary, stock, available_stock, borrow_count, image_url)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        title=VALUES(title),
        author=VALUES(author),
        publisher=VALUES(publisher),
        category_id=VALUES(category_id),
        summary=VALUES(summary),
        stock=VALUES(stock),
        available_stock=VALUES(available_stock),
        borrow_count=VALUES(borrow_count),
        image_url=VALUES(image_url)
    """
    cursor.executemany(sql, books_data)


# ==============================
# 主程序
# ==============================

def main():
    db = pymysql.connect(**DB_CONFIG)
    cursor = db.cursor()

    for category_id, keyword in CATEGORIES.items():
        print(f"\n📘 正在爬取分类：{keyword}（category_id={category_id}）")

        all_books = []
        page = 1

        while len(all_books) < BOOKS_PER_CATEGORY:
            docs = get_books(keyword, page=page, limit=100)
            if not docs:
                print("⚠️ 没有更多数据，提前结束。")
                break

            parsed = parse_books(docs, category_id)
            all_books.extend(parsed)
            print(f"📦 当前累计有效书籍：{len(all_books)}")

            # 防止无限循环
            if len(docs) < 10:
                break

            page += 1
            time.sleep(REQUEST_INTERVAL)

        # 截取前50本
        books_to_insert = all_books[:BOOKS_PER_CATEGORY]

        if books_to_insert:
            insert_books_to_db(cursor, books_to_insert)
            db.commit()
            print(f"✅ 成功插入 {len(books_to_insert)} 条书籍记录。")
        else:
            print(f"⚠️ {keyword} 没有可插入的书籍。")

    cursor.close()
    db.close()
    print("\n🎉 所有分类爬取完成！")


if __name__ == "__main__":
    main()

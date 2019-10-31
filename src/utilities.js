/**
 * @brief XPath を指定して該当する最初の要素を取得する
 * @param {in} doc 
 * @param {in} xpath 
 * @return 該当要素
 */
function selectSingleNode(doc, xpath, ctxt) {
    if (!ctxt) ctxt = doc;
    var results = doc.evaluate(xpath, ctxt, null, XPathResult.ANY_TYPE, null);
    return results.iterateNext();
}
/**
 * @brief XPath を指定して該当する要素をすべて取得する
 * @param {in} doc 
 * @param {in} xpath 
 * @return 該当要素のリスト
 */
function selectNodes(doc, xpath, ctxt) {
    if (!ctxt) ctxt = doc;
    var results = doc.evaluate(xpath, ctxt, null, XPathResult.ANY_TYPE, null);
    var nodes = [];
    var node = results.iterateNext();
    while (node) {
        nodes.push(node);
        node = results.iterateNext();
    }
    return nodes;
}
/**
 * @brief a タグのhref からURL を生成
 * @param {in} href 
 */
function urlFromHref(href) {
    if (href.startsWith("http")) {
        return href;
    }
    return location.protocol + "//" + location.host + "/" + href;
}
/**
 * @brief 
 * @param {in} url アクセスするURL
 * @param {in} callback 取得完了後に呼び出すコールバック(Document を引数にとる)
 * @param {in} timeout タイムアウトミリ秒
 * @param {in} ontimeout タイムアウト時に呼び出されるコールバック
 */
function getPage(url, callback, timeout, ontimeout) {
    //console.log(url);
    //console.log(callback);
    if (timeout == null || timeout == undefined) timeout = 5000;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    if (callback) {
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (xhr.responseXML) {
                    callback(xhr.responseXML);
                }
                else if (xhr.responseText) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(xhr.responseText, "text/html");
                    callback(doc);
                }
                return true;
            }
        };
        xhr.timeout = timeout;
        if (ontimeout) {
            xhr.ontimeout = ontimeout;
        }
    }
    xhr.send(null);
}
// N 日目
var day_pattern = /(?<index>\d+)\s*日目/;
/**
 * @brief 日付文字列から何日目かを取得
 * @param {in} today 日付文字列(プロローグ|N日目|エピローグ)
 * @retval 0 プロローグ
 * @retval Number.MAX_SAFE_INTEGER エピローグ
 * @retval 1~ 何日目か
 */
function getDayIndex(today) {
    if (today == "エピローグ") {
        return Number.MAX_SAFE_INTEGER;
    }
    var day_index = 0;
    var results = day_pattern.exec(today);
    if (results) {
        day_index = parseInt(results["groups"]["index"], 10);
    }
    return day_index;
}
/**
 * @brief ドキュメントから日ごとのメッセージをすべて取得
 * @param {in} doc 
 * @return 日ごとのメッセージ
 */
function extractAllMessages(doc) {
    var messages = [];
    // すべて表示のリンクを取得
    var all_mes_link = selectSingleNode(doc, ".//div[@class='main']/a[contains(@href, 'mes=all')]");
    // すべて表示のリンクがあればそちらから
    if (all_mes_link) {
        getPage(urlFromHref(all_mes_link.getAttribute("href")), function (d) {
            messages = selectNodes(d, ".//div[@class='main']/div[contains(@class, 'message ch')]");
        });
    }
    // そうでなければこのページから
    else {
        messages = selectNodes(doc, ".//div[@class='main']/div[contains(@class, 'message ch')]");
    }
    return messages;
}
/**
 * @brief 要素の配列をクローン
 * @param {in} elements 
 */
function cloneElements(elements) {
    var buffer = [];
    for (var i = 0; i < elements.length; ++i) {
        buffer.push(elements[i].cloneNode(true));
    }
    return buffer;
}
/**
 * @brief ノードからキャラクターデータ作成
 * @param {in} div
 */
function CharacterData(doc, div, is_valid) {
    // 有効かどうか
    this.is_valid = is_valid;
    // 名前
    var elem = selectSingleNode(doc, ".//*[@class='ch_name']", div);
    if (elem) {
        this.ch_name = elem.textContent;
    }
    // 画像
    elem = selectSingleNode(doc, ".//img[contains(@src, 'face')]", div);
    if (elem) {
        this.img_src = urlFromHref(elem.getAttribute("src"));
    }
}
/**
 * @brief ノードからメッセージデータ柵瀬
 * @param {in} doc 
 * @param {in} div 
 */
function MessageData(doc, div) {
    var elem = null;
    // キャラ
    elem = selectSingleNode(doc, ".//div[contains(@class, 'message ch')]", div);
    if (elem) {
        this.tag = elem.getAttribute("class");
    }
    else {
        // extra と思われる
        this.tag = div.getAttribute("class");
    }
    // 日付
    elem = selectSingleNode(doc, ".//span[@class='time']", div);
    if (elem) {
        this.time = elem.textContent;
    }
    else {
        this.time = "";
    }
    // ID
    elem = selectSingleNode(doc, ".//span[@class='mes_no']", div);
    if (elem) {
        this.mes_no = elem.textContent;

        elem = selectSingleNode(doc, ".//*[@class='ch_name']", div);
        this.id = elem.getAttribute("name");
        // 本文
        elem = selectSingleNode(doc, ".//div[contains(@class, 'mes_')]/div[contains(@class, 'mes_')]", div);
        this.mes_class = elem.getAttribute("class");
        this.message = elem.textContent;
    }
    else {
        this.mes_no = "";
        this.id = "";
        // 本文
        elem = selectSingleNode(doc, ".//div[contains(@class, 'announce') or contains(@class, 'extra')]", div);
        if (elem) {
            this.mes_class = elem.getAttribute("class");
            this.message = elem.textContent;
        }
        else {
            this.mes_class = "";
            this.message = "";
        }
    }
}
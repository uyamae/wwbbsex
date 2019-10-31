// 村データ
function VillageData() {
    this.url = urlFromHref("");
    this.days = {};
    this.chars = {};
}
// 村データに各日のデータを追加
VillageData.prototype.addDay = function(day, doc) {
    // プロローグ？
    var is_valid = (day != "プロローグ");
    // メッセージノード取得
    var messages = cloneElements(extractAllMessages(doc));
    var data = { messages : [] };
    for (var i = 0; i < messages.length; ++i) {
        var message = new MessageData(doc, messages[i]);
        var ch = message.tag;
        if (!(ch in this.chars)) {
            this.chars[ch] = { data : new CharacterData(doc, messages[i], is_valid), messages : [] };
        }
        else if (is_valid && !this.chars[ch].data.is_valid) {
            this.chars[ch].data.is_valid = true;
        }
        this.chars[ch].messages.push(message);
        data.messages.push(message);
    }
    this.days[day] = data;

    return messages;
};
/**
 * @brief データを登録
 */
function registerData(data, doc, day, day_links) {
    var messages = data.addDay(day, doc);
    if (day_links.length == 0) {
        // background に送る
        chrome.runtime.sendMessage(
            {
                type: "add",
                village: "test",
                data: data
            }
        );
    }
    return messages;
}
/**
 * @brief 開始
 */
function start() {
    var func = function f(day_links, data) {
        var elem = day_links.shift();
        var day = elem.textContent;
        // リンクならリンク先を展開
        if (elem.localName == "a") {
            getPage(urlFromHref(elem.getAttribute("href")), function (doc) {
                registerData(data, doc, day, day_links);
                if (day_links.length > 0) {
                    f(day_links, data);
                }
            });
        }
        // そうでなければこのページから展開
        else {
            registerData(data, document, day, day_links);
            if (day_links.length > 0) {
                f(day_links, data);
            }
            chrome.runtime.onMessage.addListener(
                function (request, sender, sendResponse) {
                    if ((request.type == "checked") || (request.type == "unchecked")) {
                        var selected = selectNodes(document, ".//div[@class='" + request.key + "']");
                        var disp = (request.type == "checked") ? "none" : "block";
                        for (var div of selected) {
                            div.style.display = disp;
                        }
                    }
                }
            );
        }
    };
    // 各ページのリンクの情報
    func(selectNodes(document, ".//div[@class='main']/p[1]/*"), new VillageData());
}
start();


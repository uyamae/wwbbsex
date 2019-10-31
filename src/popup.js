
/**
 * @brief XPath を指定して該当する最初の要素を取得する
 * @param {in} doc 
 * @param {in} xpath 
 * @return 該当要素
 */
function selectSingleNode(doc, xpath, context) {
    if (!context) context = doc;
    var results = doc.evaluate(xpath, context, null, XPathResult.ANY_TYPE, null);
    return results.iterateNext();
}
/**
 * @brief XPath を指定して該当する要素をすべて取得する
 * @param {in} doc 
 * @param {in} xpath 
 * @return 該当要素のリスト
 */
function selectNodes(doc, xpath, context) {
    if (!context) context = doc;
    var results = doc.evaluate(xpath, context, null, XPathResult.ANY_TYPE, null);
    var nodes = [];
    var node = results.iterateNext();
    while (node) {
        nodes.push(node);
        node = results.iterateNext();
    }
    return nodes;
}

function getImageElement(array) {
    if (array.length <= 0) return null;
    var div = array[0];
    return selectSingleNode(document, ".//img", div);
}

function setImageChecked(img, checked) {
    if (img.checked != checked) {
        img.checked = checked;
        img.style.webkitFilter = checked ? "brightness(40%)" : "brightness(100%)";
    }
}

function setCheckedFunc(key, img, parent) {
    return function(checked) {
        setImageChecked(img, checked);
        var type = img.checked ? "checked" : "unchecked";
        chrome.runtime.sendMessage(
            {
                type: type,
                village: "test",
                key: key
            }
        );
    }
}
function onClickImage(img, callback) {
    return function() {
        callback(!img.checked);
    };
}
// ウィンドウが開くときの処理
function show() {
    //console.log("getTest()");

    // background から村データを取得
    chrome.runtime.sendMessage(
        { type : "get", village : "test" },
        // コールバック
        function (data) {
            //console.log("getTest() callback");
            //console.log(data);

            // popup.html からid=faces の要素を取得
            var elem = document.getElementById("faces");
            var tr = document.createElement("tr");
            var added = false;
            var callbacks = [];
            // 村データの各キャラクターについて処理
            for (var key in data.chars) {
                // システムメッセージはスキップ
                if (key == "message ch0") continue;
                var charData = data.chars[key].data;
                // 有効でないキャラはスキップ(おそらくプロローグで立ち去り)
                if (!charData.is_valid) continue;

                // キャラごとにテーブルのtd 要素を追加
                var td = tr.appendChild(document.createElement("td"));
                var newElem = document.createElement("span");
                // console.log(key + ":" + charData.checked);
                if (charData.img_src) {
                    // 画像を追加
                    // 元サイトにリンクしている、一度表示しているのでキャッシュしていると期待…
                    var img = document.createElement("img");
                    img.setAttribute("src", charData.img_src);
                    img.setAttribute("width", "50%");
                    img.setAttribute("height", "50%");
                    // 画像をクリックしたときのコールバック(コメントの表示を切り替え)
                    var callback = setCheckedFunc(key, img, td);
                    img.addEventListener("click", onClickImage(img, callback), false);
                    setImageChecked(img, charData.checked);
                    newElem.appendChild(img);
                    callbacks.push(callback);
                }
            /*
                if (charData.ch_name) {
                    var span = document.createElement("span");
                    span.textContent = charData.ch_name;
                    newElem.appendChild(span);
                }
                else {
                    newElem.textContent = key;
                }
            */
                td.appendChild(newElem);
                if (!added) {
                    added = true;
                }
            }
            // 追加があればtr をテーブルに追加
            if (added) {
                // 一括切り替えボタンを追加
                var td = tr.appendChild(document.createElement("td"));
                var newElem = document.createElement("span");
                newElem.textContent = "全";
                newElem.addEventListener("click", function() {
                    setImageChecked(newElem, !newElem.checked);
                    for (var cb of callbacks) {
                        cb(newElem.checked);
                    }
                }, false);
                td.appendChild(newElem);

                elem.appendChild(tr);
            }
        }
    );
}
// ウィンドウが開くときのコールバック
window.onload = function() {
    show();
};

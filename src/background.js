// 村データ
var villages = {};

// データをアクティブなタブに送る
function sendData(type, key, data) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (tabs) {
            var t = tabs[0];
            if (!t) return;
            chrome.tabs.sendMessage(
                t.id,
                {
                    type: type,
                    village: "test",
                    key: key,
                    data: data
                }
            );
        }
    );
}

// content_script.js, popup.js からメッセージを受信
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(request.type);
        console.log(request.village);
        switch (request.type) {
        case "add":
            villages[request.village] = request.data;
            break;
        case "remove":
            delete villages[request.village];
            break;
        case "get":
            sendResponse(villages[request.village]);
            break;
        case "checked":
            var data = villages[request.village];
            data.chars[request.key].checked = true;
            sendData("checked", request.key, data);
            break;
        case "unchecked":
            var data = villages[request.village];
            data.chars[request.key].checked = false;
            sendData("unchecked", request.key, data);
            break;
        }
    }
);

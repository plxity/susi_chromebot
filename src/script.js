/* jslint browser:true */
/* global SpeechSynthesisUtterance */
/* global webkitSpeechRecognition */
/* global chrome */
/* global L */
var messages = document.getElementById("messages");
var formid = document.getElementById("formid");
var textarea = document.getElementById("textarea");
var mic = document.getElementById("mic");
var micimg = document.getElementById("micimg");
var micmodal = document.getElementById("micmodal");
var setting = document.getElementById("setting");
var clear = document.getElementById("clear");
let scrollIconBottomElement = document.getElementById("scrollIconBottom");
let scrollIconTopElement = document.getElementById("scrollIconTop");
var exportData = document.getElementById("export");
var dark = false;
var upCount = 0;
var shouldSpeak = true;
var isOlderMessage = false;
var storageItems = [];
var storageArr = [];
var exportArr = [];
var backUrl = localStorage.getItem("theValue");
var box = document.getElementById("box");
var headerbox = document.getElementById("headerbox");
var theme = localStorage.getItem("theme");
var msgTheme = localStorage.getItem("msgTheme");
var but = document.getElementById("but");
var backUrl = localStorage.getItem("theValue");
var box = document.getElementById("box");
var BASE_URL = "https://api.susi.ai";
var queryAnswerData = JSON.parse(localStorage.getItem("messages"));
var accessToken = "";
var mapAccessToken = "pk.eyJ1IjoiZ2FicnUtbWQiLCJhIjoiY2pja285N2g0M3cyOTJxbnR1aTJ5aWU0ayJ9.YkpBlvuHFgd2V9DGHOElVA";
var synth = window.speechSynthesis;
var voice = localStorage.getItem("voice");
let micDiv = document.getElementById("micdiv");
let sendDiv = document.getElementById("senddiv");

let speakOutput = (msg, speak = false) => {
    if (speak) {
        var voiceMsg = new SpeechSynthesisUtterance(msg);
        var voices = synth.getVoices();
        if (voice === null){
			voice = 5; // default male voice
		}
        voiceMsg.voice = voices[voice];
        window.speechSynthesis.speak(voiceMsg);
    }
};

let feedback = (isPositive, skill) => {
    let apiUrl = "https://api.susi.ai";
    let rating = "negative";
    if (isPositive) {
        rating = "positive";
    }
    if (skill !== null){
        let rateEndPoint =
        apiUrl +
        "cms/rateSkill.json?model="+
        skill.model +
        "group="+
        skill.group +
        "language="+
        skill.language +
        "skill="+
        skill.skill +
        "rating="+
        rating;

        $.ajax({
            url: rateEndPoint,
            dataType: "jsonp",
            jsonpCallback: "p",
            jsonp: "callback",
            crossDomain: "true",
            success: (response) => {
                if (response.accepted) {
                    console.log("Skill rated successfully");
                } else {
                    console.log("Skill rating failed. Try Again");
                }
            },
            error: (jqXHR) => {
                let jsonValue = jqXHR.status;
                if (jsonValue === 404) {
                    console.log("Skill rating failed. Try Again");
                } else {
                    console.log("Some error occurred. Try Again");
                }
            },
        });
    }
};

let loading = (condition = true) => {
    if (condition === true) {
        var newDiv = document.createElement("div");
        var newImg = document.createElement("img");
        newImg.setAttribute("src", "images/loading.gif");
        newImg.setAttribute("style", "height:10px;width:auto");
        newDiv.appendChild(newImg);
        if (dark === true) {
            newDiv.setAttribute("class", "susinewmessage message-dark");
        } else {
            newDiv.setAttribute("class", "susinewmessage");
        }
        messages.appendChild(newDiv);
        messages.scrollTop = messages.scrollHeight;
    } else {
        messages.childNodes[messages.childElementCount].innerHTML = "";
    }
};


let getCurrentTime = ( currDate = new Date() ) => {
    var ap = "AM";
    var hours = currDate.getHours();
    var minutes = currDate.getMinutes();
    var time = "";
    if (hours > 12) {
        ap = "PM";
        hours -= 12;
    }
    if (hours === 12) {
        ap = "PM";
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    time = hours + ":" + minutes + " " + ap + " ";
    return time;
};

let composeImage = (image) => {
    var newImg = document.createElement("img");
    newImg.setAttribute("src", image);
    newImg.setAttribute("class", "susi-img");
    return newImg;
};

let composeLink = (link) => {
    var newA = document.createElement("a");
    newA.appendChild(document.createTextNode(link));
    newA.setAttribute("href", link);
    newA.setAttribute("target", "_blank");
    newA.setAttribute("class", "link");
    return newA;
};

let composeReplyAnswer = (response, replyData) => {
    response.reply = replyData;
    if (replyData.startsWith("https")) {
        response.image = true;
    }
    return response;
};

let composeReplyTable = (response, columns, data) => {
    var keys = Object.keys(columns);
    var table = document.createElement("table");
    table.setAttribute("class", "table-response");
    table.setAttribute("id", "table-res");
    var tableHead = document.createElement("thead");
    var trHead = document.createElement("tr");
    keys.map((key) => {
        var th = document.createElement("th");
        th.appendChild(document.createTextNode(columns[key]));
        trHead.appendChild(th);
    });
    if (keys.indexOf("web_page") !== -1) {
        keys[keys.indexOf("web_page")] = "web_pages";
    }
    tableHead.appendChild(trHead);
    table.appendChild(tableHead);
    var tableBody = document.createElement("tbody");
    data.map((item) => {
        var trItem = document.createElement("tr");
        var flag = false;
        keys.map((key) => {
            if (item[key]) {
                flag = true;
                var tdItem = document.createElement("td");
                if (key === "web_pages") {
                    var linkItem = composeLink(item[key][0]);
                    tdItem.appendChild(linkItem);
                    trItem.appendChild(tdItem);
                } else {
                    tdItem.appendChild(document.createTextNode(item[key]));
                    tdItem.setAttribute("class", "table-tweet-response");
                    trItem.appendChild(tdItem);
                }
            }
        });
        if (flag) {
            tableBody.appendChild(trItem);
        }
    });
    table.appendChild(tableBody);
    response.tableType = true;
    response.table = table;
    return response;
};

let composeSusiMessage = (response, t, rating) => {
    var newP = document.createElement("p");
    newP.setAttribute("class", "susi-text-container");
    var thumbsUp = document.createElement("span");
    var thumbsDown = document.createElement("span");
    var shareOnTwitter = document.createElement("span");
    var messageFooter = document.createElement("li");

    messageFooter.setAttribute("class", "susimessage-footer");

    thumbsUp.setAttribute("class", "fa fa-thumbs-up");
    thumbsUp.addEventListener("click", () => {
        if (thumbsUp.hasAttribute("style")) {
            thumbsUp.removeAttribute("style");
        } else {
            thumbsDown.removeAttribute("style");
            thumbsUp.style.color = "blue";
        }
        feedback(true, rating);
    });

    thumbsDown.setAttribute("class", "fa fa-thumbs-down");
    thumbsDown.addEventListener("click", () => {
        if (thumbsDown.hasAttribute("style")) {
            thumbsDown.removeAttribute("style");
        } else {
            thumbsUp.removeAttribute("style");
            thumbsDown.style.color = "red";
        }
        feedback(false, rating);
    });

    let shareMessageSUSI = response.reply === undefined ? "" : response.reply;
    shareMessageSUSI = encodeURIComponent(shareMessageSUSI.trim());
    let shareTag = " #SUSI.AI";
    shareTag = encodeURIComponent(shareTag);
    let twitterShare =
        "https://twitter.com/intent/tweet?text=" + shareMessageSUSI + shareTag;

    shareOnTwitter.setAttribute("class", "fa fa-share-alt");
    shareOnTwitter.addEventListener("click", function(){
        window.open(twitterShare, "_blank");
    });

    var newDiv = messages.childNodes[messages.childElementCount];
    newDiv.setAttribute("class", "susinewmessage");
    if (dark === true) {
        newDiv.setAttribute("class", "message-susi-dark susinewmessage");
    }
    var currtime = document.createElement("p");
    currtime.setAttribute("class", "time");
    var time = document.createTextNode(t);
    currtime.append(time);
    var susiTextNode;
    if (response.error === true) {
        susiTextNode = document.createTextNode(response.errorText);
        newP.appendChild(susiTextNode);
        newDiv.appendChild(newP);
        speakOutput(response.errorText, shouldSpeak && !isOlderMessage);
    } else {
        if (response.reply && !response.image) {
            susiTextNode = document.createTextNode(response.reply);
            newP.appendChild(susiTextNode);
            newDiv.appendChild(newP);
            speakOutput(response.reply, shouldSpeak && !isOlderMessage);
        } else if (response.image) {
            var newImg = composeImage(response.reply);
            newDiv.appendChild(document.createElement("br"));
            newDiv.appendChild(newImg);

        } else if (response.tableType) {
            newDiv.appendChild(response.table);
            if (dark === true) {
                newDiv.setAttribute("class", "table-height susinewmessage message-susi-dark");
            } else {
                newDiv.setAttribute("class", "table-height susinewmessage");
            }
        } else if (response.isMap){
            newDiv.appendChild(response.newMap);
        } else if (response.isAnchor){
            newDiv.appendChild(response.anchor);
        } else if (response.isVideo){
            newDiv.appendChild(response.video);
        }
        else {
            console.log("could not make response");
        }
    }
    if (isOlderMessage) {
        // reset isOlderMessage
        isOlderMessage = false;
    }
    exportArr.push({
        time: t,
        message: response.reply,
        image: response.image,
        map: response.newMap,
        source: "susi"
    });

    messageFooter.appendChild(currtime);
    messageFooter.appendChild(thumbsUp);
    messageFooter.appendChild(document.createTextNode(" "));
    messageFooter.appendChild(thumbsDown);
    messageFooter.appendChild(document.createTextNode(" "));
    messageFooter.appendChild(shareOnTwitter);
    newDiv.appendChild(messageFooter);
    messages.appendChild(newDiv);
    var storageObj = {
        senderClass: "",
        content: ""
    };
    var susimessage = newDiv.innerHTML;
    storageObj.content = susimessage;
    storageObj.senderClass = "susinewmessage";
    chrome.storage.local.get("message", (items) => {
        if (items.message) {
            storageArr = items.message;
            var temp = storageArr.map(x => $.parseHTML(x.content));
            var messageTest = temp.map((x, i) => "message =" + x[0].innerHTML + ", time= " + x[2].innerHTML + ((i % 2 === 0) ? "message by user" : " message by susi"));
            console.log("this was true");
            exportArr.push({
                oldmessages: messageTest
            });
        }
        storageArr.push(storageObj);
        chrome.storage.local.set({
            "message": storageArr
        }, () => {
            console.log("saved");
        });
    });
    messages.scrollTop = messages.scrollHeight;
};

let composeReplyMap = (response, action) => {
    var newDiv = messages.childNodes[messages.childElementCount];
    var mapDiv = document.createElement("div");
    var mapDivId = Date.now().toString();
    mapDiv.setAttribute("id", mapDivId);
    mapDiv.setAttribute("class", "mapClass");
    newDiv.appendChild(mapDiv);
    messages.appendChild(newDiv);
    var newMap = L.map(mapDivId).setView([Number(action.latitude), Number(action.longitude)], 13);

    L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors, <a href='http://creativecommons.org/licenses/by-sa/2.0/'>CC-BY-SA</a>, Imagery © <a href='http://mapbox.com'>Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.streets",
        accessToken: mapAccessToken
    }).addTo(newMap);

    console.log(mapDiv);

    response.isMap = true;
    response.newMap = mapDiv;
    return response;
};

let composeReplyVideo = (response, identifier) => {
    var newDiv = messages.childNodes[messages.childElementCount];
    var iframeDiv = document.createElement("iframe");
    iframeDiv.setAttribute("id", "youtube-video");
    iframeDiv.setAttribute("src", `https://www.youtube.com/embed/${identifier}?rel=0&enablejsapi=1&origin=*`);
    newDiv.appendChild(iframeDiv);
    response.isVideo = true;
    response.video = iframeDiv;
    return response;
};

let composeReplyAnchor = (response, action) => {
    var newDiv = messages.childNodes[messages.childElementCount];
    var anchorDiv = document.createElement("div");
    var actionText = document.createElement("p");
    actionText.innerText = action.text;
    var actionAnchor = document.createElement("a");
    actionAnchor.href = action.link;
    actionAnchor.text = action.link;

    anchorDiv.appendChild(actionText);
    anchorDiv.appendChild(document.createElement("br"));
    anchorDiv.appendChild(actionAnchor);

    newDiv.appendChild(anchorDiv);

    response.isAnchor = true;
    response.anchor = anchorDiv;

    return response;

};

let composeResponse = (action, data) => {
    var response = {
        error: false,
        reply: "",
        image: false,
        tableType: false,
        isMap: false,
        isAnchor: false,
        isVideo: false,
        video: ""
    };
    switch (action.type) {
        case "answer":
            response = composeReplyAnswer(response, action.expression);
            break;
        case "table":
            response = composeReplyTable(response, action.columns, data);
            break;
        case "map":
            response = composeReplyMap(response, action);
            break;
        case "anchor":
            response = composeReplyAnchor(response, action);
            break;
        case "video_play":
            response = composeReplyVideo(response, action.identifier);
            break;
        default:
            response.error = true;
            response.errorText = "No matching action type";
            break;
    }
    return response;
};

let generateRating = (skill) => {
    let parsed = skill.split("/");
    let rating = {};
    if (parsed.length === 7) {
        rating.model = parsed[3];
        rating.group = parsed[4];
        rating.language = parsed[5];
        rating.skill = parsed[6].slice(0, -4);
        return rating;
    }
    return null;
};

let successResponse = (data , timestamp = getCurrentTime(), speak = true) => {
    data.answers[0].actions.map((action) => {
        var response = composeResponse(action, data.answers[0].data);
        let skill = data.answers[0].skills[0];
        let rating = generateRating(skill);
        loading(false);
        isOlderMessage = !speak;
        composeSusiMessage(response, timestamp, rating);
        if (action.type !== data.answers[0].actions[data.answers[0].actions.length - 1].type) {
            loading(); //if not last action then create another loading box for susi response
        }
    });
};


let queryUrl = "";
let baseUrl = "https://api.susi.ai/susi/chat.json?timezoneOffset=-300&q=";

let getResponse = (query) => {
    var errorResponse = {
        error: true,
        errorText: "Sorry! request could not be made"
    };

    var noResponse = {
        error: true,
        errorText: "Hmm... I'm not sure if i understand you correctly."
    };

    var timestamp = getCurrentTime();

    loading();
    if (accessToken) {
        queryUrl = `${baseUrl}${query}&access_token=${accessToken}`;
    } else {
        queryUrl = `${baseUrl}${query}`;
    }

    $.ajax({
        dataType: "jsonp",
        type: "GET",
        url: queryUrl,
        error: (xhr, textStatus, errorThrown) => {
            console.log(xhr);
            console.log(textStatus);
            console.log(errorThrown);
            loading(false);
            composeSusiMessage(errorResponse, timestamp);
        },
        success: (data) => {
            if(!data.answers[0]){
                loading(false);
                composeSusiMessage(noResponse, timestamp);
            }
            else {
                successResponse(data);
            }

        }
    });
};

let composeMyMessage = (text, t= getCurrentTime()) => {
    $(".empty-history").remove();
    var newP = document.createElement("p");
    var newDiv = document.createElement("div");

    var messageFooter = document.createElement("li");
    messageFooter.setAttribute("class", "mymessage-footer");

    newDiv.setAttribute("class", "mynewmessage");
    if (dark === true) {
        newDiv.setAttribute("class", "message-dark mynewmessage");
    }
    var myTextNode = document.createTextNode(text);
    newP.appendChild(myTextNode);
    newDiv.appendChild(newP);
    var currtime = document.createElement("p");
    currtime.setAttribute("class", "time");
    var time = document.createTextNode(t);
    currtime.append(time);
    messageFooter.appendChild(currtime);
    newDiv.appendChild(messageFooter);
    messages.appendChild(newDiv);
    textarea.value = "";
    messages.scrollTop = messages.scrollHeight;
    var storageObj = {
        senderClass: "",
        content: ""
    };
    var mymessage = newDiv.innerHTML;
    storageObj.content = mymessage;
    storageObj.senderClass = "mynewmessage";
    exportArr.push({
        time: t,
        message: text,
        image: false,
        source: "user"
    });
    chrome.storage.local.get("message", (items) => {
        if (items.message) {
            storageArr = items.message;
        }
        storageArr.push(storageObj);
        chrome.storage.local.set({
            "message": storageArr
        }, () => {});
    });
};

let restoreMessages = (storageItems) => {
    if (!storageItems && !accessToken) {
        var htmlMsg = "<div class='empty-history'> Start by saying \"Hi\"</div>";
        $(htmlMsg).appendTo(messages);
        return;
    }
    storageItems.map((item) => {
        loading(true);
        loading(false);
        var newDiv = messages.childNodes[messages.childElementCount];
        newDiv.setAttribute("class", item.senderClass);
        newDiv.innerHTML = item.content;
    });
    chrome.storage.local.get("askSusiQuery", (items) => {
        if (items.askSusiQuery) {
            var query = items.askSusiQuery;
            textarea.value = query;
            document.getElementById("but").click();
            chrome.storage.local.remove("askSusiQuery");
            chrome.browserAction.setBadgeText({
                text: ""
            });
        }
    });
};

let syncMessagesFromServer = () => {

    if (queryAnswerData !== null) {
        chrome.storage.sync.remove("message");
        for (var i = 0; i < queryAnswerData.length; i++) {
            var query = queryAnswerData[i].query;
            var queryTime = queryAnswerData[i].queryTime;
            queryTime = new Date(Date.parse(queryAnswerData[i].queryTime));
            queryTime = getCurrentTime(queryTime);
            var answerTime = queryAnswerData[i].answerTime;
			answerTime = new Date(Date.parse(queryAnswerData[i].answerTime));
			answerTime = getCurrentTime(answerTime);
            var answer = queryAnswerData[i].answer;
            composeMyMessage(query, queryTime);
            var garbageElement = `<div class="mynewmessage"><p></p><br><p class="time"></p></div>`;
            $(".empty-history").remove();
            messages.insertAdjacentHTML("beforeend", garbageElement);
            successResponse(answer, answerTime, false);
        }
        queryAnswerData = null;
        localStorage.setItem("messages", null);
        $(".empty-history").remove();
    }
};

window.onload = () => {
    if (backUrl) {
        box.style.backgroundImage = "url(" + backUrl + ")";
        box.style.backgroundRepeat = "no-repeat";
        box.style.backgroundSize = "cover";
    }
    if (theme) {
        headerbox.style.backgroundColor = theme;
        mic.style.color = theme;
        but.style.color = theme;
        console.log(theme);
    }
    if (msgTheme) {
        box.style.backgroundColor = msgTheme;
        console.log(msgTheme);
    }

    chrome.storage.local.get("loggedUser", (userDetails) => {
        var log = document.getElementById("log");
        var settings = document.getElementById("settings-tab");
        if (userDetails.loggedUser && userDetails.loggedUser.email) {
            accessToken = userDetails.loggedUser.accessToken;
            log.innerHTML = log.innerHTML.replace("Login", "Logout");
            log.innerHTML = log.innerHTML.replace("login.svg", "logout.png");
            settings.style.display = "flex";
        } else {
            log.innerHTML = log.innerHTML.replace("Logout", "Login");
            log.innerHTML = log.innerHTML.replace("logout.png", "login.svg");
            settings.style.display = "none";
        }
    });
    syncMessagesFromServer();
    chrome.storage.local.get("message", (items) => {
        if (items) {
            storageItems = items.message;
            restoreMessages(storageItems);
        } else {
            $(".empty-history").remove();
        }
	});
};


let handleScroll = () => {
  var end=messages.scrollHeight - messages.scrollTop === messages.clientHeight;
  if(end){
    scrollIconBottomElement.style.display="none";
    scrollIconTopElement.style.display="block";
  }
  else{
    scrollIconBottomElement.style.display="block";
    scrollIconTopElement.style.display="none";
  }
};

if (messages) {
    messages.addEventListener("scroll", handleScroll);
}
// to download file
let download = (filename, text) => {
    var element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

let submitForm = () => {
    var text = textarea.value;
    text = text.trim();
    if (text === "") {
        return console.log("Empty Query!");
    }
    composeMyMessage(text);
    if (window.navigator.onLine) {
        getResponse(text);
    } else {
        loading();
        var response = {
            error: true,
            errorText: "Not connected to Internet!"
        };
        loading(false);
        composeSusiMessage(response);
    }
};

var recognizing;

let reset = () => {
    recognizing = false;
};

var recognition = new webkitSpeechRecognition();
recognition.onerror = (e) => {
    console.log(e.error);
};

recognition.onstart = () =>{
    micimg.setAttribute("src", "images/mic-animate.gif");
};

reset();

recognition.onend = () => {
    reset();
    micmodal.classList.remove("active");
    micimg.setAttribute("src", "images/mic.gif");
};

recognition.onresult = (event) => {
    var interimText = " ";
    for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            textarea.value = event.results[i][0].transcript;
            submitForm();
        } else {
            interimText += event.results[i][0].transcript;
            textarea.value += interimText;
        }
    }
};

let toggleStartStop = () => {
    navigator.getUserMedia({
            audio: true
        },
        () => {
            if (recognizing) {
                recognition.stop();
                reset();
                micmodal.classList.remove("active");
            } else {
                recognition.start();
                recognizing = true;
                micmodal.className += " active";
            }
        },
        () => {
            
            $("body").overhang({
                type:"error",
                message:  `<div style="padding-left: 8px;">Please Enable Mic by setting option(Note: If you have blocked the mic before you have to remove it from chrome settings and then enable from extension)</div>`,
                duration: 3,
                html: true,
            });
        });
};

mic.addEventListener("click", () => {
    toggleStartStop();
});

setting.addEventListener("click", () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("options.html")
    });
});

clear.addEventListener("click", () => {
    var checkDark = 0;
    if(dark === true){
      checkDark = 1;
    }
    chrome.storage.sync.clear();
    if(checkDark === 1){
      dark = true;
      chrome.storage.sync.set({
          "darktheme": true
      }, () => {});
    }
});

exportData.addEventListener("click", () => {
    download("susiExport.json", JSON.stringify(exportArr));
});

textarea.onkeyup = (e) => {
    var prevMessages, myQuery;
    try {
        if (e.which === 38) {
            upCount = upCount + 1;
            prevMessages = document.getElementsByClassName("mynewmessage");
            myQuery = prevMessages[prevMessages.length - upCount].getElementsByTagName("p")[0].textContent;
            textarea.value = myQuery;
        }
        if (e.which === 40) {
            upCount = upCount - 1;
            prevMessages = document.getElementsByClassName("mynewmessage");
            myQuery = prevMessages[prevMessages.length - upCount].getElementsByTagName("p")[0].textContent;
            textarea.value = myQuery;
        }
        if (e.which === 13 && !e.shiftKey) {
            upCount = 0;
            e.preventDefault();
            submitForm();
        }
    } catch (excep) {}
};

formid.addEventListener("submit", (e) => {
    e.preventDefault();
    submitForm();
});

chrome.storage.sync.get("darktheme", (obj) => {
    if (obj.darktheme === true) {
        console.log("Dark theme state true");
        document.getElementById("check").click();
    }
});

let sendUserSettingsToServer = (darkTheme, accessToken) => { // Sending  user settings to api
    var themevalue = "";
    if (darkTheme !== true) {
        themevalue = "light";
    } else {
        themevalue = "dark";
    }
    var changeUserSettings = BASE_URL + "/aaa/changeUserSettings.json?key1=theme&value1=" + themevalue + "&access_token=" + accessToken + "&count=1";
    $.ajax({
        url: changeUserSettings,
        dataType: "jsonp",
        jsonpCallback: "p",
        jsonp: "callback",
        crossDomain: "true",
        success: () => {
            console.log("user Settings successfully sent");
        }
    });
};

let check = () => {
    if (dark === false) {
        dark = true;
        chrome.storage.sync.set({
            "darktheme": true
        }, () => {});
    } else {
        dark = false;
        chrome.storage.sync.set({
            "darktheme": false
        }, () => {});
    }
    chrome.storage.sync.get("loggedUser", (userDetails) => { // checks if the user is loggedin or not
        if(userDetails.loggedUser){
            if (userDetails.loggedUser.accessToken) {
                accessToken = userDetails.loggedUser.accessToken;
            }
        }
        sendUserSettingsToServer(dark, accessToken); // Sends the theme settings to server
    });
    var box = document.getElementById("box");
    box.classList.toggle("box-modified");
    var field = document.getElementById("field");
    field.classList.toggle("fieldmod");
    var body = document.getElementById("body");
    body.classList.toggle("body");
    var butt = document.getElementById("but");
    butt.classList.toggle("butmod");
    mic.classList.toggle("butmod");
    var headerbox = document.getElementById("headerbox");
    headerbox.classList.toggle("header-modified");
    var surroundbox = document.getElementById("surroundbox");
    surroundbox.classList.toggle("surroundbox-modified");
    formid.classList.toggle("darkform");
    textarea.classList.toggle("textarea-mod");
    var icon = document.getElementById("icon");
    icon.classList.toggle("icon-mod");
    var icon1 = document.getElementById("icon1");
    icon1.classList.toggle("icon1-mod");
    var doc = document.getElementById("doc");
    doc.classList.toggle("dark");
    var dropdown = document.getElementById("dropdown");
    dropdown.classList.toggle("drop-dark");
    var micmodal = document.getElementById("micmodal");
    micmodal.classList.toggle("micmodal-modified");
    $(".susinewmessage").toggleClass("message-susi-dark");
    $(".mynewmessage").toggleClass("message-dark");
    $("#scrollIcon").toggleClass("scroll-dark");
};

chrome.storage.sync.get("speakcheck", (obj) => {
  if(obj.speakcheck === false){
    document.getElementById("speak").click();
  }
});

let changeSpeak = () => {
    shouldSpeak = !shouldSpeak;
    var SpeakIcon = document.getElementById("speak-icon");
    if (!shouldSpeak) {
        SpeakIcon.innerText = "volume_off";
    } else {
        SpeakIcon.innerText = "volume_up";
    }
    console.log("Should be speaking? " + shouldSpeak);
    chrome.storage.sync.set({
        "speakcheck": shouldSpeak
    }, () => {});
};

scrollIconTopElement.addEventListener("click", (e) => {
    $(messages).stop().animate({
        scrollTop: 0
    }, 800);
    e.preventDefault();
});

scrollIconBottomElement.addEventListener("click", (e) => {
    $(messages).stop().animate({
        scrollTop: $(messages)[0].scrollHeight
    }, 800);
    e.preventDefault();
});

document.getElementById("check").addEventListener("click", check);
document.getElementById("speak").addEventListener("click", changeSpeak);

textarea.addEventListener("input", (e) => {
    if(e.target.value) {
        micDiv.style.display = "none";
        sendDiv.style.display = "block";
    }
    else {
        micDiv.style.display = "block";
        sendDiv.style.display = "none";
    }
});

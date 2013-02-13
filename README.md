CrossFrame Utility
==================

The CrossFrame module add HTML5 Web Messaging feature for legend browser such as IE6 and IE7. It also creates an same API interface for all browsers no matter they support HTML5 Web Messaging or not.

* Use Y.CrossFrame.postMessage() instead of window.postMessage.
* Use Y.Global.on("crossframe:message") instead of window.onmessage.
     
Because there must be browsers which don't support postMessage, you have to provide a proxy file which is at same domain with the receiving iframe. Download the proxy file here. [http://josephj.com/project/yui3-crossframe/proxy.html](http://josephj.com/project/yui3-crossframe/proxy.html)

NOTE: The original idea is coming from Julien Lecomte's "Introducing CrossFrame, a Safe Communication Mechanism Across Documents and Across Domains.
 
## Example

Demo Page - [http://josephj.com/project/yui3-crossframe/simple.html](http://josephj.com/project/yui3-crossframe/simple.html)

* Sender - Y.CrossFrame.postMessage
```javascript
YUI().use("crossframe", function (Y) {
    var formNode = Y.one("form");
    formNode.on("submit", function (e) {
        e.preventDefault();
        var frameName = "frames['simple-iframe']",
            message   = formNode.one("textarea").get("value"),
            config    = {
                "proxy"       : "http://josephjiang.com/project/yui3-crossframe/proxy.html",
                "reverseProxy": "http://josephj.com/project/yui3-crossframe/proxy.html",
                "eventType"   : "crossframe:test1",
                "callback"    : function (o) {
                    alert(o.info);
                }
            };
        Y.CrossFrame.postMessage(frameName, message, config);
    });
});
```
* Receiver - Y.Global.on
```javascript
YUI().use("crossframe", function (Y) {
   Y.Global.on("crossframe:test1", function (e, data, callback) {
       Y.one("#data").set("innerHTML", data.message);
       //callback({"info": "some information from receiver. (" + parseInt(new Date().getTime()) + ")"});
   });
}); 
```

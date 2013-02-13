CrossFrame Utility
==================

The CrossFrame module adds HTML5 Web Messaging feature for legend browser including IE6 and IE7. It also creates same API interface for all browsers no matter they support HTML5 Web Messaging or not.

* Use `Y.CrossFrame.postMessage()` instead of `window.postMessage`.
* Use `Y.Global.on("crossframe:message")` instead of `window.onmessage`.
     
Because there must be some legend browsers which don't support postMessage, you have to provide a proxy file which is at same domain with the receiving iframe. Download the proxy file: [http://josephj.com/project/yui3-crossframe/proxy.html](http://josephj.com/project/yui3-crossframe/proxy.html)

NOTE: The original idea is from Julien Lecomte's "[Introducing CrossFrame, a Safe Communication Mechanism Across Documents and Across Domains](http://www.julienlecomte.net/blog/2007/11/31/).
 
## Example

Demo Page - [http://josephj.com/project/yui3-crossframe/simple.html](http://josephj.com/project/yui3-crossframe/simple.html)

* Sender uses `Y.CrossFrame.postMessage()`

     ```javascript
     YUI().use("crossframe", function (Y) {
          Y.CrossFrame.postMessage("frames['<FRAME NAME>']", <MESSAGE>, {
               "proxy": "http://<DOMAIN OF TARGET IFRAME>/proxy.html"
         });
     });
     ```
* Receiver uses `Y.Global.on("crossframe:message")`

     ```javascript
     YUI().use("crossframe", function (Y) {
          Y.Global.on("crossframe:message", function (e, data, callback) {
              alert(data.message);
          });
     }); 
     ```

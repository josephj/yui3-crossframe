CrossFrame Utility
==================

The CrossFrame module add HTML5 Web Messaging feature for legend browser such as IE6 and IE7. It also creates an same API interface for all browsers no matter they support HTML5 Web Messaging or not.

* Use Y.CrossFrame.postMessage() instead of window.postMessage.
* Use Y.Global.on("crossframe:message") instead of window.onmessage.
     
Because there must be browsers which don't support postMessage, you have to provide a proxy file which is at same domain with the receiving iframe. Download the proxy file here. [http://josephj.com/project/yui3-crossframe/proxy.html](http://josephj.com/project/yui3-crossframe/proxy.html)

NOTE: The original idea is coming from Julien Lecomte's "Introducing CrossFrame, a Safe Communication Mechanism Across Documents and Across Domains.
 

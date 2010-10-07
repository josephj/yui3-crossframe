/*global window, YUI, document, location */
/*jslint evil: true */
YUI.add("crossframe-base", function (Y) {

    /**
     * Base Cross Frame functionality. Provides basic cross-browser frame messaging support.
     *
     * @module    crossframe
     * @submodule crossframe-base
     * @author    Joseph Chiang <http://josephj.com/>
     * @created   2010/10/7
     */

    /**
     * Embed this JavaScript as external file for both sender and receiver page.
     * You can enjoy using same API interface without worrying browser compatibility issues.
     * Use Y.CrossFrame.postMessage() instead of HTML 5 window.postMessage.
     * Use Y.on("crossframe:message") instead of HTML 5 window.onmessage
     *
     * @class crossframe
     */

    var _proxyUrl,
        //=============================
        // Constants
        //=============================
        PATTERN = /top|parent|frames\[(?:(?:['"][a-zA-Z\-_]*['"])|\d+)\]/,
        /**
         * @event crossframe:message
         * @description This event is fired when target frame receive message
         * @type Event Custom
         */
        E_RECEIVE = "crossframe:message",
        //=============================
        // Private Methods
        //=============================
        _init,
        //=============================
        // Private Methods
        //=============================
        _messagePublisher,
        //=============================
        // Public Methods
        //=============================
        postMessage;


    /*
     * Create a event publisher to set custom event.
     * The reason to use custom event is to wrap onmessage event for simplification.
     * All browsers use Y.Global.on("crossframe:message", fn) to receive message.
     * Because the custom event will be accessed in different YUI instance,
     * setting this event to global is required.
     *
     * @method _messagePublisher
     * @private
     * @return {Y.EventTarget}
     */
    _messagePublisher = (function () {
        Y.log("_messagePublisher(): is executed", "info", "CrossFrame");
        var _messagePublisher = new Y.EventTarget();
        _messagePublisher.name = "Cross-frame Message Publisher";
        _messagePublisher.publish(E_RECEIVE, {
            broadcast:  2,
            emitFacade: true
        });
        return _messagePublisher;
    }());

    /*
     * Cross-browser postMessage method
     *
     * @method postMessage
     * @param target  {String} Window object using string "frames['foo']"
     * @param message {String} Message you want to send to target document (frame)
     * @param config  {Object} The most important property is proxy, URL of proxy file.
     *                         Set this or legend browsers won't work.
     *                         The page source code should be exactly same with
     *                         http://josephj.com/lab/cross-frame/proxy.html
     * @return void
     */
    postMessage =  function (target, message, config) {
        Y.log("postMessage(): is executed", "info", "CrossFrame");
        config = config || {};

        // Check requirement arguments
        if (!target || !message) {
            throw new Error("postMessage Error: You have to provide both target and message arguments.");
        }
        var iframeEl,
            iframeNode,
            iframeLoadHandle,
            proxyUrl,
            dataString;

        dataString = [
            "target=" + encodeURIComponent(target),
            "message=" + encodeURIComponent(message),
            "domain=" + encodeURIComponent(document.domain),
            "url=" + encodeURIComponent(location.href)
        ].join("&");

        // Check if target string is in right format
        if (!PATTERN.test(target)) {
            throw new Error("postMessage Error: frame string format error!");
        }


        if (typeof window.postMessage !== "undefined") {
            // HTML5's way to post message to different frames without domain security restriction
            target = PATTERN.exec(target);
            target = eval(target[0]);
            target.postMessage(dataString, "*");
        } else {
            // Legend browsers like IE 6 or 7 using "iframe in iframe" hack
            // Get proxy URL
            if (config.proxy) {
                proxyUrl = config.proxy;
            } else {
                throw new Error("You can't use Y.CrossFrame.postMessage in this legend browser without providing proxy URL");
            }

            // Create a hidden iframe
            iframeEl = document.createElement("iframe");
            iframeEl.style.position   = "absolute";
            iframeEl.style.top        = "0";
            iframeEl.style.left       = "0";
            iframeEl.style.visibility = "hidden";
            iframeEl.style.width      = "0";
            iframeEl.style.height     = "0";
            document.body.appendChild(iframeEl);

            // Remove <iframe/> while it sends request succesfully
            iframeNode = Y.one(iframeEl);
            iframeLoadHandle = iframeNode.on("load", function () {
                Y.detach(iframeLoadHandle);
                Y.later(1000, null, function () {
                    document.body.removeChild(iframeEl);
                });
            });

            // Compose iframe URL which includes message
            iframeEl.src = proxyUrl + "#" + dataString;

            // Append Iframe to document body
            document.body.appendChild(iframeEl);
        }
    };

    // Promote CrossFrame to global
    Y.CrossFrame = {
        "postMessage": postMessage,
        "_messagePublisher": _messagePublisher
    };

    /*
     * Initialization for CrossFrame utility
     * It's only useful if host page is receiver and browser has implemented postMessage.
     *
     * @method _init
     * @private
     */
    _init = function () {
        Y.log("init(): is executed", "info", "CrossFrame");
        if (typeof window.postMessage !== "undefined") {
            var onmessage =  function (e) {
                var data    = Y.QueryString.parse(e.data),
                    message = data.message,
                    domain  = data.domain,
                    url     = data.url;

                _messagePublisher.fire(E_RECEIVE, message, domain, url);
            };
            // FIXME : Can't use Y.on directly to attach event listener, why?
            if (typeof window.addEventListener !== "undefined") {
                window.addEventListener("message", onmessage, false);
            } else if (typeof window.attachEvent !== "undefined") {
                window.attachEvent("onmessage", onmessage);
            }
        }
    };
    _init();

}, "3.2.0", {"requires": ["event-custom", "querystring-parse"]});

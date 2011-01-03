/*global window, YUI, document, location */
/*jslint evil: true */
YUI.add("crossframe", function (Y) {
    /**
     * <p>The CrossFrame module add HTML5 Web Messaging feature for legend browser
     * such as IE6 and IE7. It also creates an same API interface for all browsers no matter
     * they support HTML5 Web Messaging or not.</p>
     *
     * <p>1. Use Y.CrossFrame.postMessage() instead of window.postMessage.<br>
     * 2. Use Y.Global.on("crossframe:message") instead of window.onmessage<p>
     *
     * <p>Because there must be browsers which don't support postMessage,
     * you always have to provide a proxy file which is
     * at same domain with the receiving iframe.
     * Download the proxy file here:
     * <a href="http://josephj.com/project/yui3-crossframe/proxy.html">
     * http://josephj.com/project/yui3-crossframe/proxy.html</a></p>
     *
     * <p>NOTE: The original idea is coming from Julien Lecomte's
     *  "Introducing CrossFrame, a Safe Communication Mechanism
     *  Across Documents and Across Domains."</p>
     *
     * @module crossframe
     * @class CrossFrame
     * @static
     */

    var _proxyUrl,
        //=============================
        // Constants
        //=============================
        PATTERN = /top|parent|frames\[(?:(?:['"][a-zA-Z0-9\-_]*['"])|\d+)\]/,
        /**
         * @event crossframe:message
         * @description This event is fired by YUI.CrossFrame when target frame has received message
         * @param {Y.Event.Facade} event An Event Facade object
         * @param {String} message Message which was sent by origin frame
         * @param {String} domain Domain of origin frame
         * @param {String} url URL of origin frame
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


    /**
     * Create a event publisher to set custom event.
     * The reason to use custom event is to wrap onmessage event for simplification.
     * All browsers use Y.Global.on("crossframe:message", fn) to receive message.
     * Because the custom event will be accessed in different YUI instance,
     * setting this event to global is required.
     *
     * @for CrossFrame
     * @property _messagePublisher
     * @private
     * @static
     */
    _messagePublisher = (function () {
        Y.log("_messagePublisher(): is executed", "info", "CrossFrame");
        var _publisher = new Y.EventTarget();
        _publisher.name = "Cross-frame Message Publisher";
        _publisher.publish(E_RECEIVE, {
            broadcast:  2,    // Not just in this instance.
            emitFacade: true  // Make "this" keyword accessible by user.
        });
        return _publisher;
    }());

    /**
     * Cross-browser postMessage method
     *
     * @for CrossFrame
     * @method postMessage
     * @static
     * @param {String} target Window object using string "frames['foo']"
     * @param {String} message Message you want to send to target document (frame)
     * @param {Object} config The most important property is proxy, URL of proxy file.
     *                         Set this or legend browsers won't work.
     *                         The page source code should be exactly same with
     *                         http://josephj.com/project/yui3-crossframe/proxy.html
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
            frameString,
            proxyUrl,
            dataString;

        dataString = [
            "target=" + encodeURIComponent(target),
            "message=" + encodeURIComponent(message),
            "domain=" + encodeURIComponent(document.domain),
            "url=" + encodeURIComponent(location.href),
            "source=" + window.name
        ].join("&");

        // Check if target string is in right format
        if (!PATTERN.test(target)) {
            throw new Error("postMessage Error: frame string format error!\n" + target);
        }
        if (typeof window.postMessage !== "undefined") {
            // HTML5's way to post message to different frames without domain security restriction
            frameString = PATTERN.exec(target);

            target = PATTERN.exec(target);
            target = target[0];
            try {
                target = eval(target);
                target.postMessage(dataString, "*");
            } catch (e) {
                Y.log(e.message + " - " + frameString, "error", "CrossFrame");
            }
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

    /**
     * Initialization for CrossFrame utility
     * It's only useful if host page is receiver and browser has implemented postMessage.
     *
     * @method _init
     * @private
     * @return void
     */
    _init = function () {
        Y.log("_init(): is executed", "info", "CrossFrame");

        // Supports HTML 5 Web Messaging only.
        if (typeof window.postMessage === "undefined") {
            return;
        }
        var onmessage =  function (e) {
            var data    = Y.QueryString.parse(e.data),
                message = data.message,
                domain  = data.domain,
                url     = data.url,
                source  = data.source;

            _messagePublisher.fire(E_RECEIVE, message, domain, url, source);
        };

        // FIXME : Can't use Y.on directly to attach event listener, why?
        if (typeof window.addEventListener !== "undefined") {
            window.addEventListener("message", onmessage, false);
        } else if (typeof window.attachEvent !== "undefined") {
            window.attachEvent("onmessage", onmessage);
        }
    };
    _init();
}, "3.2.0", {"requires": ["node-base", "event-custom", "querystring-parse"]});

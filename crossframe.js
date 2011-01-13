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
     * Download the proxy file and put it to the domain you want post messages to.
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

    var //=============================
        // Constants
        //=============================
        PATTERN = /top|parent|opener|frames\[(?:(?:['"][a-zA-Z\d-_]*['"])|\d+)\]/,
        /**
         * @event crossframe:message
         * @description This event is fired by YUI.CrossFrame when target frame has received message
         * @param {Y.Event.Facade} event An Event Facade object
         * @param {Object} message Message which was sent by origin frame
         * @param {Function} callback Make callback to origin window/frame by executing this function in event handler.
         * @type Event Custom
         */
        DEFAULT_EVENT   = "crossframe:message",
        MODULE_ID       = "CrossFrame",
        SUCCESS_MESSAGE = "__SUCCESS_CALLBACK__",
        //=============================
        // Private Events
        //=============================
        _onMessage,
        //=============================
        // Private Methods
        //=============================
        _init,
        //=============================
        // Public Attribute
        //=============================
        messageReceiveEvent,
        //=============================
        // Public Methods
        //=============================
        addPublisher,
        appendFrame,
        postMessage;

    

    /**
     * Handles HTML 5 onmessage event.
     * It fires Y.CrossFrame.messageReceiveEvent custom event so that user can handles it.
     * Legend browser like IE6 doesn't trigger this event.
     *
     * @event _onMessage
     * @param e
     * @private
     */
    _onMessage =  function (e) {
        var evt       = {}, 
            callback  = null,
            publisher = null,
            data      = Y.QueryString.parse(e.data),
            tid       = data.tid,
            message   = data.message,
            eventType = data.eventType,
            target    = data.target,
            sourceUrl = data.url;


        // Receive confirmation message, executing prepared onSuccess function 
        // when receive succssful callback message.
        if (decodeURIComponent(message) === SUCCESS_MESSAGE) {
            try {
                window[tid](data);
            } catch (e2) {
                Y.log(e2.message, "error", MODULE_ID);
            }
            return;
        }

        // Reproduce event object.
        // Make it very similar with onmessage event object.
        evt = {
            "type"        : eventType,
            "data"        : e.data,
            "origin"      : e.origin,
            "lastEventId" : e.lastEventId,
            "source"      : e.source,
            "ports"       : e.ports
        };

        // Prepare callback message function.
        callback = function (o) {
            var i,
                query;
            
            // Change attribute object to query string.
            query = [];
            for (i in o) {
                if (o.hasOwnProperty(i)) {
                    // Avoid overwrite.
                    if (i === "url" || i === "target" || i === "tid" || i === "message") {
                        continue;
                    }
                    o[i] = o[i].toString();
                    query.push(i + "=" + encodeURIComponent(o[i]));    
                }
            }
            
            // Compose information to query string.
            url = [
                "url=" + encodeURIComponent(sourceUrl),
                "target=" + encodeURIComponent(target),
                "tid=" + tid,
                "message=" + encodeURIComponent(Y.CrossFrame.SUCCESS_MESSAGE)
            ].join("&");

            e.source.postMessage(url + "&" + query.join("&"), "*");
        };

        // Handle specific message by using Y.on("crossframe:<label>").
        if (eventType) {
            publisher = addPublisher(eventType);
            publisher.fire(eventType, evt, data, callback);
        }

        // Use Y.Global.on("crossframe:message") to handle all messages.
        messageReceiveEvent.fire(DEFAULT_EVENT, evt, data, callback);

    };

    /**
     * Create a event publisher to set custom event.
     * The reason to use custom event is to wrap onmessage event for simplification.
     * All browsers use Y.Global.on("crossframe:message", fn) to receive message.
     * Because the custom event will be accessed in different YUI instance,
     * setting this event to global is required.
     *
     * @for CrossFrame
     * @property messageReceiveEvent
     * @private
     * @static
     */
    messageReceiveEvent = (function () {
        Y.log("messageReceiveEvent(): is executed", "info", MODULE_ID);
        return addPublisher(DEFAULT_EVENT, "Cross-frame Message Publisher");
    }());


    //=============================
    // Public Methods
    //=============================
    /**
     * Add custom event publisher.
     *
     * @method addPublisher
     * @public
     * @parame {String} eventType Custom Event type.
     * @parame {String} eventName Custom Event name.
     * @return {Y.EventTarget}
     */
    addPublisher = function (eventType, eventName) {
        var publisher = new Y.EventTarget();
        publisher.name = eventName;
        publisher.publish(eventType, {
            broadcast:  2,
            emitFacade: true
        });
        return publisher;
    };

    /**
     * Dynamically creating an iframe.
     *
     * @method appendFrame
     * @public
     * @return void
     */
    appendFrame = function (url) {
        Y.log("appendFrame(): is executed", "info", MODULE_ID);

        var iframeEl,
            iframeNode,
            iframeLoadHandle;

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
        iframeEl.src = url;

        // Append Iframe to document body
        document.body.appendChild(iframeEl);
    };

    /**
     * Cross-browser postMessage method
     *
     * @for CrossFrame
     * @method postMessage
     * @static
     * @param {String} target Window object using string "frames['foo']"
     * @param {Mixed} message Message you want to send to target document (frame)
     * @param {Object} config The most important property is proxy, URL of proxy file.
     *                        Set this or legend browsers won't work.
     *                        The page source code should be exactly same with
     *                        http://josephj.com/project/yui3-crossframe/proxy.html
     * @return void
     */
    postMessage =  function (target, message, config) {
        Y.log("postMessage(): is executed", "info", MODULE_ID);

        // Check required arguments.
        if (!target || !message) {
            Y.log("You have to provide both target and message arguments.", "error", MODULE_ID);
            return;
        }

        // Check if target string is in right format.
        if (!PATTERN.test(target)) {
            Y.log("Frame string format error!\n" + target, "error", MODULE_ID);
            return;
        }

        // Default attribute object.
        config              = config || {};
        config.callback     = config.callback     || null;
        config.proxy        = config.proxy        || null;
        config.reverseProxy = config.reverseProxy || null;
        config.eventType    = config.eventType    || null;

        // Message must be transformed to string format.
        if (typeof message === "Object") {
            message = Y.JSON.stringify(message);
        }

        var dataString,
            frameString,
            tId;

        // Wrap required data.
        tId = parseInt(new Date().getTime(), 10);
        dataString = [
            "tid=" + tId,                                              // Trasaction ID.
            "eventType=" + encodeURIComponent(config.eventType),       // Event Name.
            "target=" + encodeURIComponent(target),                    // Target frame name.
            "message=" + encodeURIComponent(message),                  // User only uses this column.
            "domain=" + encodeURIComponent(document.domain),           // Source domain.
            "url=" + encodeURIComponent(location.href),                // Source URL.
            "reverseProxy=" + encodeURIComponent(config.reverseProxy), // Callback proxy for legend browsers.
            "source=" + encodeURIComponent(window.name),               // Source frame name. It might be empty because top window usually doesn't have namei property.
            // For proxy.html...
            "origin=" + location.host,
            "ports=" + location.port
        ].join("&");

        isSupport = (typeof window.postMessage === "undefined" ? false : true);
        isSupport = (target === "opener" && Y.UA.ie ? false : isSupport); // IE doesn't support postMessage to opener
        switch (isSupport) {
        case false: // Legend browsers like IE 6 or 7 using "iframe in iframe" hack.

            // Legend browsers like IE 6 or 7 using "iframe in iframe" hack.
            if (!config.proxy) {
                Y.log("You can't use Y.CrossFrame.postMessage in this legend browser without providing proxy URL", "error", MODULE_ID);
                return;
            }

            // Create Iframe to send message.
            appendFrame(config.proxy + "#" + dataString);
            break;
        case true: // HTML5's way to post message to different frames without domain security restriction
            // Check if the target does exist.
            try {
                target = eval(target);
            } catch (e) {
                Y.log(e.message, "error", MODULE_ID);
                return;
            }
            
            target.postMessage(dataString, "*");
            break;
        }

        // Bind onSuccess function.
        window[tId] = function (o) {
            delete o.message;
            delete o.target;
            delete o.tid;
            delete o.url;
            config.callback(o);
        };

        return tId;

    };

    // Promote CrossFrame to global
    Y.CrossFrame = {
        "SUCCESS_MESSAGE"     : SUCCESS_MESSAGE,
        "addPublisher"        : addPublisher,
        "appendFrame"         : appendFrame,
        "messageReceiveEvent" : messageReceiveEvent,
        "postMessage"         : postMessage
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
        Y.log("_init(): is executed", "info", MODULE_ID);

        if (typeof window.addEventListener !== "undefined") {
            window.addEventListener("message", _onMessage, false);
        } else if (typeof window.attachEvent !== "undefined") {
            window.attachEvent("onmessage", _onMessage);
        }
    };
    _init();

}, "3.2.0", {"requires": ["node-base", "event-custom", "querystring-parse", "json-stringify"]});

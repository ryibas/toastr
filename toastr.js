/*
 * Toastr
 * Copyright 2012-2015
 * Authors: John Papa, Hans Fjällemark, and Tim Ferrell.
 * All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * ARIA Support: Greta Krafsig
 * Dependency Removing Support: Ryan Baseman
 * 
 * Original Project: https://github.com/CodeSeven/toastr
 * No dependency Toastr: https://github.com/ryibas/toastr
 */
var toastr = (function () {

        var toastContainer;
        var listener;
        var toastId = 0;
        var toastType = {
            error: 'error',
            info: 'info',
            success: 'success',
            warning: 'warning'
        };

        var toastr = {
            clear: clear,
            remove: remove,
            error: error,
            getContainer: getContainer,
            info: info,
            options: {},
            subscribe: subscribe,
            success: success,
            version: '2.1.3',
            warning: warning
        };

        var previousToast;

        return toastr;

        ////////////////

        function error(message, title, optionsOverride) {
            return notify({
                type: toastType.error,
                iconClass: getOptions().iconClasses.error,
                message: message,
                optionsOverride: optionsOverride,
                title: title
            });
        }

        function getContainer(options, create) {
            if (!options) { options = getOptions(); }

            toastContainer = document.getElementById(options.containerId);

            if (toastContainer) {
                return toastContainer;
            }
            if (create) {
                toastContainer = createContainer(options);
            }
            return toastContainer;
        }

        function info(message, title, optionsOverride) {
            return notify({
                type: toastType.info,
                iconClass: getOptions().iconClasses.info,
                message: message,
                optionsOverride: optionsOverride,
                title: title
            });
        }

        function subscribe(callback) {
            listener = callback;
        }

        function success(message, title, optionsOverride) {
            return notify({
                type: toastType.success,
                iconClass: getOptions().iconClasses.success,
                message: message,
                optionsOverride: optionsOverride,
                title: title
            });
        }

        function warning(message, title, optionsOverride) {
            return notify({
                type: toastType.warning,
                iconClass: getOptions().iconClasses.warning,
                message: message,
                optionsOverride: optionsOverride,
                title: title
            });
        }

        function clear(toastElement, clearOptions) {
            var options = getOptions();
            if (!toastContainer) { getContainer(options); }
            
            if (!clearToast(toastElement, options, clearOptions)) {
                clearContainer(options);
            }
        }

        function remove(toastElement) {
            var options = getOptions();
            if (!toastContainer) { getContainer(options); }
            if (toastElement && toastElement.querySelector(':focus')) {
                removeToast(toastElement);
                return;
            }
            if (toastContainer.children().length) {
                toastContainer.parentNode.removeChild(toastContainer);
            }
        }

        // private functions

        function clearContainer(options) {

            if (!toastContainer.hasChildNodes()) {
                return;
            }

            var toastsToClear = toastContainer.childNodes;
            for (var i = toastsToClear.length - 1; i >= 0; i--) {
                clearToast(toastsToClear[i], options);
            }
        }

        function clearToast(toastElement, options, clearOptions) {
            var force = clearOptions && clearOptions.force ? clearOptions.force : false;
            if (toastElement && (force || !toastElement.querySelector(':focus'))) {
                removeToast(toastElement);
                return true;
            }
            return false;
        }

        function createContainer(options) {
            toastContainer = document.createElement('div');
            toastContainer.id = options.containerId;
            toastContainer.className += ' ' + options.positionClass;

            document.querySelector(options.target).appendChild(toastContainer);

            return toastContainer;
        }

        function getDefaults() {
            return {
                tapToDismiss: true,
                toastClass: 'toast',
                containerId: 'toast-container',
                debug: false,

                onHidden: undefined,
                closeOnHover: true,

                extendedTimeOut: 1000,
                iconClasses: {
                    error: 'toast-error',
                    info: 'toast-info',
                    success: 'toast-success',
                    warning: 'toast-warning'
                },
                iconClass: 'toast-info',
                positionClass: 'toast-top-right',
                timeOut: 5000, // Set timeOut and extendedTimeOut to 0 to make it sticky
                titleClass: 'toast-title',
                messageClass: 'toast-message',
                escapeHtml: false,
                target: 'body',
                closeHtml: '<button type="button">&times;</button>',
                closeClass: 'toast-close-button',
                newestOnTop: true,
                preventDuplicates: false,
                progressBar: false,
                progressClass: 'toast-progress',
                rtl: false
            };
        }

        function publish(args) {
            if (!listener) { return; }
            listener(args);
        }

        function notify(map) {
            var options = getOptions();
            var iconClass = map.iconClass || options.iconClass;

            if (typeof (map.optionsOverride) !== 'undefined') {
                options = extend(options, map.optionsOverride);
                iconClass = map.optionsOverride.iconClass || iconClass;
            }

            if (shouldExit(options, map)) { return; }

            toastId++;

            toastContainer = getContainer(options, true);

            var intervalId = null;
            var toastElement = document.createElement('div');
            var titleElement = document.createElement('div');
            var messageElement = document.createElement('div');
            var progressElement = document.createElement('div');
            var closeElement = document.createElement('div');
            closeElement.innerHTML = options.closeHtml;
            var progressBar = {
                intervalId: null,
                hideEta: null,
                maxHideTime: null
            };
            var response = {
                toastId: toastId,
                state: 'visible',
                startTime: new Date(),
                options: options,
                map: map
            };

            personalizeToast();

            displayToast();

            handleEvents();

            publish(response);

            if (options.debug && console) {
                console.log(response);
            }

            return toastElement;

            function escapeHtml(source) {
                if (source == null) {
                    source = '';
                }

                return source
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }

            function personalizeToast() {
                setIcon();
                setTitle();
                setMessage();
                setCloseButton();
                setProgressBar();
                setRTL();
                setSequence();
                setAria();
            }

            function setAria() {
                var ariaValue = '';
                switch (map.iconClass) {
                    case 'toast-success':
                    case 'toast-info':
                        ariaValue = 'polite';
                        break;
                    default:
                        ariaValue = 'assertive';
                }
                toastElement.setAttribute('aria-live', ariaValue);
            }

            function handleEvents() {

                if (options.closeOnHover) {
                    toastElement.onmouseover = stickAround;
                    toastElement.onmouseout = delayedHideToast;
                }

                if (!options.onclick && options.tapToDismiss) {
                    toastElement.onclick = hideToast;
                }

                if (options.closeButton && closeElement) {
                    closeElement.onclick = function (event) {
                        if (event.stopPropagation) {
                            event.stopPropagation();
                        } else if (event.cancelBubble !== undefined && event.cancelBubble !== true) {
                            event.cancelBubble = true;
                        }

                        if (options.onCloseClick) {
                            options.onCloseClick(event);
                        }

                        hideToast(true);
                    };
                }

                if (options.onclick) {
                    toastElement.onclick = function (event) {
                        options.onclick(event);
                        hideToast();
                    };
                }
            }

            function displayToast() {
                if (options.timeOut > 0) {
                    intervalId = setTimeout(hideToast, options.timeOut);
                    progressBar.maxHideTime = parseFloat(options.timeOut);
                    progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                    if (options.progressBar) {
                        progressBar.intervalId = setInterval(updateProgress, 10);
                    }
                }
            }

            function setIcon() {
                if (map.iconClass) {
                    toastElement.className += ' ' + options.toastClass;
                    toastElement.className += ' ' + iconClass;
                }
            }

            function setSequence() {
                if (options.newestOnTop) {
                    toastContainer.insertBefore(toastElement, toastContainer.childNodes[0]);
                } else {
                    toastContainer.appendChild(toastElement);
                }
            }

            function setTitle() {
                if (map.title) {
                    var suffix = map.title;
                    if (options.escapeHtml) {
                        suffix = escapeHtml(map.title);
                    }

                    titleElement.innerHTML += suffix;
                    titleElement.className += ' ' + options.titleClass;
                    toastElement.appendChild(titleElement);
                }
            }

            function setMessage() {
                if (map.message) {
                    var suffix = map.message;
                    if (options.escapeHtml) {
                        suffix = escapeHtml(map.message);
                    }

                    messageElement.innerHTML = suffix;
                    messageElement.className += ' ' + options.messageClass;
                    toastElement.appendChild(messageElement);
                }
            }

            function setCloseButton() {
                if (options.closeButton) {
                    closeElement.childNodes[0].className += ' ' + options.closeClass;
                    closeElement.childNodes[0].setAttribute('role', 'button');
                    toastElement.insertBefore(closeElement, toastElement.childNodes[0]);
                }
            }

            function setProgressBar() {
                if (options.progressBar) {
                    progressElement.className += ' ' + options.progressClass;
                    toastElement.insertBefore(progressElement, toastElement.childNodes[0]);
                }
            }

            function setRTL() {
                if (options.rtl) {
                    toastElement.className += ' rtl';
                }
            }

            function shouldExit(options, map) {
                if (options.preventDuplicates) {
                    if (map.message === previousToast) {
                        return true;
                    } else {
                        previousToast = map.message;
                    }
                }
                return false;
            }

            function hideToast(override) {
                console.log('hideToast');

                if (toastElement && toastElement.querySelector(':focus') && !override) {
                    return;
                }

                clearTimeout(progressBar.intervalId);
                removeToast(toastElement);
                clearTimeout(intervalId);
                if (options.onHidden && response.state !== 'hidden') {
                    options.onHidden();
                }

                response.state = 'hidden';
                response.endTime = new Date();
                publish(response);
                return;
            }

            function delayedHideToast() {
                if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                    intervalId = setTimeout(hideToast, options.extendedTimeOut);
                    progressBar.maxHideTime = parseFloat(options.extendedTimeOut);
                    progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                }
            }

            function stickAround() {
                clearTimeout(intervalId);
                progressBar.hideEta = 0;
            }

            function updateProgress() {
                var percentage = ((progressBar.hideEta - (new Date().getTime())) / progressBar.maxHideTime) * 100;
                progressElement.style.width = percentage + '%';
            }
        }

        function getOptions() {
            return extend(getDefaults(), toastr.options);
        }

        function removeToast(toastElement) {
            if (!toastContainer) { toastContainer = getContainer(); }

            if (toastElement.style.visibility == 'visible') {
                return;
            }

            toastElement.parentNode.removeChild(toastElement);
            toastElement = null;

            if (!toastContainer.hasChildNodes()) {
                toastContainer.parentNode.removeChild(toastContainer);
                previousToast = undefined;
            }
        }

        function extend(obj, src) {
            Object.keys(src).forEach(function (key) { obj[key] = src[key]; });
            return obj;
        }
    })();
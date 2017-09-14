/**
 * angular-ui-notification - Angular.js service providing simple notifications using Bootstrap 3 styles with css transitions for animating
 * @author Alex_Crack
 * @version v0.3.6
 * @link https://github.com/alexcrack/angular-ui-notification
 * @license MIT
 */
angular.module('ui-notification',[]);

angular.module('ui-notification').provider('Notification', function() {

    this.options = {
        delay: 5000,
        startTop: 10,
        startRight: 10,
        verticalSpacing: 10,
        horizontalSpacing: 10,
        positionX: 'right',
        positionY: 'top',
        replaceMessage: false,
        templateUrl: 'angular-ui-notification.html',
        onClose: undefined,
        closeOnClick: true,
        maxCount: 0, // 0 - Infinite
        container: 'body',
        priority: 10
    };

    this.setOptions = function(options) {
        if (!angular.isObject(options)) throw new Error("Options should be an object!");
        this.options = angular.extend({}, this.options, options);
    };

    this.$get = ["$timeout", "$http", "$compile", "$templateCache", "$rootScope", "$injector", "$sce", "$q", "$window", function($timeout, $http, $compile, $templateCache, $rootScope, $injector, $sce, $q, $window) {
        var options = this.options;

        var startTop = options.startTop;
        var startRight = options.startRight;
        var verticalSpacing = options.verticalSpacing;
        var horizontalSpacing = options.horizontalSpacing;
        var delay = options.delay;

        var messageElements = [];
        var isResizeBound = false;

        var notify = function(args, t){
            var deferred = $q.defer();

            if (typeof args !== 'object' || args === null) {
                args = {message:args};
            }

            args.scope = args.scope ? args.scope : $rootScope;
            args.template = args.templateUrl ? args.templateUrl : options.templateUrl;
            args.delay = !angular.isUndefined(args.delay) ? args.delay : delay;
            args.type = t || args.type || options.type ||  '';
            args.positionY = args.positionY ? args.positionY : options.positionY;
            args.positionX = args.positionX ? args.positionX : options.positionX;
            args.replaceMessage = args.replaceMessage ? args.replaceMessage : options.replaceMessage;
            args.onClose = args.onClose ? args.onClose : options.onClose;
            args.closeOnClick = (args.closeOnClick !== null && args.closeOnClick !== undefined) ? args.closeOnClick : options.closeOnClick;
            args.container = args.container ? args.container : options.container;
            args.priority = args.priority ? args.priority : options.priority;
            
            var template=$templateCache.get(args.template);

            if(template){
                processNotificationTemplate(template);
            }else{
                // load it via $http only if it isn't default template and template isn't exist in template cache
                // cache:true means cache it for later access.
                $http.get(args.template,{cache: true})
                  .then(function(response){
                    processNotificationTemplate(response.data);
                  })
                  .catch(function(data){
                    throw new Error('Template ('+args.template+') could not be loaded. ' + data);
                  });                
            }    
            
            
             function processNotificationTemplate(template) {

                var scope = args.scope.$new();
                scope.message = $sce.trustAsHtml(args.message);
                scope.title = $sce.trustAsHtml(args.title);
                scope.t = args.type.substr(0,1);
                scope.delay = args.delay;
                scope.onClose = args.onClose;

                var priorityCompareTop = function(a, b) {
                    return a._priority - b._priority;
                };

                var priorityCompareBtm = function(a, b) {
                    return b._priority - a._priority;
                };

                var reposite = function() {
                    var j = 0;
                    var k = 0;
                    var lastTop = startTop;
                    var lastRight = startRight;
                    var lastPosition = [];

                    if( args.positionY === 'top' ) {
                        messageElements.sort( priorityCompareTop );
                    } else if( args.positionY === 'bottom' ) {
                        messageElements.sort( priorityCompareBtm );
                    }

                    for(var i = messageElements.length - 1; i >= 0; i --) {
                        var element  = messageElements[i];
                        if (args.replaceMessage && i < messageElements.length - 1) {
                            element.addClass('killed');
                            continue;
                        }
                        var elHeight = parseInt(element[0].offsetHeight);
                        var elWidth  = parseInt(element[0].offsetWidth);
                        var position = lastPosition[element._positionY+element._positionX];

                        if ((top + elHeight) > window.innerHeight) {
                            position = startTop;
                            k ++;
                            j = 0;
                        }

                        var top = (lastTop = position ? (j === 0 ? position : position + verticalSpacing) : startTop);
                        var right = lastRight + (k * (horizontalSpacing + elWidth));

                        element.css(element._positionY, top + 'px');
                        if (element._positionX == 'center') {
                            element.css('left', parseInt(window.innerWidth / 2 - elWidth / 2) + 'px');
                        } else {
                            element.css(element._positionX, right + 'px');
                        }

                        lastPosition[element._positionY+element._positionX] = top + elHeight;

                        if (options.maxCount > 0 && messageElements.length > options.maxCount && i === 0) {
                            element.scope().kill(true);
                        }

                        j ++;
                    }
                };

                var templateElement = $compile(template)(scope);
                templateElement._positionY = args.positionY;
                templateElement._positionX = args.positionX;
                templateElement._priority = args.priority;
                templateElement.addClass(args.type);

                var closeEvent = function(e) {
                    e = e.originalEvent || e;
                    if (e.type === 'click' || (e.propertyName === 'opacity' && e.elapsedTime >= 1)){
                        if (scope.onClose) {
                            scope.$apply(scope.onClose(templateElement));
                        }

                        templateElement.remove();
                        messageElements.splice(messageElements.indexOf(templateElement), 1);
                        scope.$destroy();
                        reposite();
                    }
                };

                if (args.closeOnClick) {
                    templateElement.addClass('clickable');
                    templateElement.bind('click', closeEvent);
                }

                templateElement.bind('webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd', closeEvent);

                if (angular.isNumber(args.delay)) {
                    $timeout(function() {
                        templateElement.addClass('killed');
                    }, args.delay);
                }

                setCssTransitions('none');

                angular.element(document.querySelector(args.container)).append(templateElement);
                var offset = -(parseInt(templateElement[0].offsetHeight) + 50);
                templateElement.css(templateElement._positionY, offset + "px");
                messageElements.push(templateElement);

                if(args.positionX == 'center'){
                    var elWidth = parseInt(templateElement[0].offsetWidth);
                    templateElement.css('left', parseInt(window.innerWidth / 2 - elWidth / 2) + 'px');
                }

                $timeout(function(){
                    setCssTransitions('');
                });

                function setCssTransitions(value){
                    ['-webkit-transition', '-o-transition', 'transition'].forEach(function(prefix){
                        templateElement.css(prefix, value);
                    });
                }

                scope._templateElement = templateElement;

                scope.kill = function(isHard) {
                    if (isHard) {
                        if (scope.onClose) {
                            scope.$apply(scope.onClose(scope._templateElement));
                        }

                        messageElements.splice(messageElements.indexOf(scope._templateElement), 1);
                        scope._templateElement.remove();
                        scope.$destroy();
                        $timeout(reposite);
                    } else {
                        scope._templateElement.addClass('killed');
                    }
                };

                $timeout(reposite);

                if (!isResizeBound) {
                    angular.element($window).bind('resize', function(e) {
                        $timeout(reposite);
                    });
                    isResizeBound = true;
                }

                deferred.resolve(scope);

            }

            return deferred.promise;
        };

        notify.primary = function(args) {
            return this(args, 'primary');
        };
        notify.error = function(args) {
            return this(args, 'error');
        };
        notify.success = function(args) {
            return this(args, 'success');
        };
        notify.info = function(args) {
            return this(args, 'info');
        };
        notify.warning = function(args) {
            return this(args, 'warning');
        };

        notify.clearAll = function() {
            angular.forEach(messageElements, function(element) {
                element.addClass('killed');
            });
        };

        return notify;
    }];
});

angular.module("ui-notification").run(["$templateCache", function($templateCache) {$templateCache.put("angular-ui-notification.html","<div class=\"ui-notification\"><h3 ng-show=\"title\" ng-bind-html=\"title\"></h3><div class=\"message\" ng-bind-html=\"message\"></div></div>");}]);
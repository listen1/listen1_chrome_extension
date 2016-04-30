/**
 * angular-ui-notification - Angular.js service providing simple notifications using Bootstrap 3 styles with css transitions for animating
 * @author Alex_Crack
 * @version v0.1.0
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
        templateUrl: 'angular-ui-notification.html'
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

            if (typeof args !== 'object') {
                args = {message:args};
            }

            args.scope = args.scope ? args.scope : $rootScope;
            args.template = args.templateUrl ? args.templateUrl : options.templateUrl;
            args.delay = !angular.isUndefined(args.delay) ? args.delay : delay;
            args.type = t || options.type ||  '';
            args.positionY = args.positionY ? args.positionY : options.positionY;
            args.positionX = args.positionX ? args.positionX : options.positionX;
            args.replaceMessage = args.replaceMessage ? args.replaceMessage : options.replaceMessage;

            $http.get(args.template,{cache: $templateCache}).success(function(template) {

                var scope = args.scope.$new();
                scope.message = $sce.trustAsHtml(args.message);
                scope.title = $sce.trustAsHtml(args.title);
                scope.t = args.type.substr(0,1);
                scope.delay = args.delay;

                var reposite = function() {
                    var j = 0;
                    var k = 0;
                    var lastTop = startTop;
                    var lastRight = startRight;
                    var lastPosition = [];
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

                        j ++;
                    }
                };

                var templateElement = $compile(template)(scope);
                templateElement._positionY = args.positionY;
                templateElement._positionX = args.positionX;
                templateElement.addClass(args.type);
                templateElement.bind('webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd click', function(e){
                    e = e.originalEvent || e;
                    if (e.type === 'click' || (e.propertyName === 'opacity' && e.elapsedTime >= 1)){
                        templateElement.remove();
                        messageElements.splice(messageElements.indexOf(templateElement), 1);
                        scope.$destroy();
                        reposite();
                    }
                });
                if (angular.isNumber(args.delay)) {
                    $timeout(function() {
                        templateElement.addClass('killed');
                    }, args.delay);
                }

                angular.element(document.getElementsByTagName('body')).append(templateElement);
                var offset = -(parseInt(templateElement[0].offsetHeight) + 50);
                templateElement.css(templateElement._positionY, offset + "px");
                messageElements.push(templateElement);

                scope._templateElement = templateElement;

                scope.kill = function(isHard) {
                    if (isHard) {
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

            }).error(function(data){
                throw new Error('Template ('+args.template+') could not be loaded. ' + data);
            });

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

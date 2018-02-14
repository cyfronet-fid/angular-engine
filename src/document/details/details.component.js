angular.module('engine.document')
    .component('engineDocumentDetails', {
        templateUrl: '/src/document/details/details.tpl.html',

        controller: function ($parse, $window, $scope) {
            var self = this;
            this.$parse = $parse;

            self.isVisible = function () {
                return $scope.$parent.sideMenuVisible;
            };

            this.formatEntry = (entry) => {
                let r = this.$parse(entry.name)(this.ngModel);

                if(!_.isUndefined(r) && _.isDate(r) && entry.type === 'date')
                    r = $filter('date')(r);
                return r;
            };

            this.saveDocument = function () {
                self.savePromise = self.actions.callSave();
                return self.savePromise;
            };
        },
        bindings: {
            ngModel: '<',
            options: '=',
            actions: '=',
            dirty: '='
        }
    })
    .filter('conditionFulfiled', function ($parse) {
        return function (items, document) {
            var filtered = [];

            angular.forEach(items, function (item) {
                if (item.condition == null || $parse(item.condition)(document) === true)
                    filtered.push(item);
            });
            return filtered;
        }
    })
    .directive('scrollRwd', ['$window', '$document', '$timeout', function ($window, $document, $timeout) {
        return {
            restrict: 'AEC',
            link: link
        };
        function link(scope, element, attrs) {
            scope.windowHeight = $window.innerHeight;

            attrs.$observe('isVisible', function (val) {
                if (val) {
                    $timeout(function () {
                        scope.windowHeight = $window.innerHeight;
                        updateScroll()
                    });
                }
            });

            angular.element($window).on('resize', function () {
                scope.windowHeight = $window.innerHeight;
                updateScroll();
                scope.$digest();
            });

            function updateScroll() {
                var marginBottom = 10;
                var elementHeight = element[0].scrollHeight;
                var elementTop = element[0].getBoundingClientRect().top;

                if (elementHeight > 0 && elementHeight + elementTop > scope.windowHeight) {
                    var heightToSave = scope.windowHeight - elementTop - marginBottom + "px";
                    element.css("height", heightToSave);
                    element.addClass("scroll-rwd")
                } else {
                    element.css("height", "auto");
                    element.removeClass("scroll-rwd")
                }
            }
        }
    }])
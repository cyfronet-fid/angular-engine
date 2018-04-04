var module = angular.module('engine.common');

module.directive('sidebarAddon', function SidebarAddonDirective($compile) {
    return {
        templateUrl: '/src/common/sidebar-addon/sidebar-addon.tpl.html',
        restrict: 'E',
        scope: {
          tag: '@',
          document: '=',
          ctx: '=',
          caption: '@',
        },
        link: function link($scope, $element, attrs) {
            let newElement = $compile(`<${$scope.tag} document="document" ctx="ctx"></${$scope.tag}>`)($scope);
            $element.children().eq(0).children().eq(0).append(newElement);
        }
    };
});
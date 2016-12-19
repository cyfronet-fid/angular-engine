'use strict';

var ENGINE_VERSION = '@@__ENGINE_VERSION__';
var ENGINE_BACKEND_VERSION = '@@__ENGINE_BACKEND_VERSION__';
var ENGINE_VERSIONS = '@@__GIT_TAGS__';

angular.module('docsApp').directive('engineVersion', function() {
    return {
        template: '{{version}}',
        controller: function ($scope) {
            $scope.version = ENGINE_VERSION;
        }
    };
});
angular.module('docsApp').directive('engineBackendVersion', function() {
    return {
        template: '{{backendVersion}}',
        controller: function ($scope) {
            $scope.backendVersion = ENGINE_BACKEND_VERSION;
        }
    };
});
angular.module('docsApp').component('engineVersionSelector', {
    template:
    '<div class="btn-group" uib-dropdown is-open="status.isopen">'+
    '<button id="single-button" type="button" class="btn btn-primary" uib-dropdown-toggle>'+
    'Current: <span engine-version></span> <span class="caret"></span>'+
    '</button>'+
    '<ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">'+
    '<li role="menuitem" ng-repeat="version in versions"><a href="../{{::version}}/">{{::version}}</a></li>'+
    '</ul>'+
    '</div>',
    controller: function ($scope) {
        $scope.versions = ENGINE_VERSIONS.split('|');
    }
});
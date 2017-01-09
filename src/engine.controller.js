/**
 * @ngdoc controller
 * @name engine.controller:engineMainCtrl
 * @description
 *
 * Main application controller, does not have much functionality yet,
 * apart from setting a few `$rootScope` variables
 *
 */
angular.module('engine').controller('engineMainCtrl', function ($rootScope, engineResourceLoader) {
    $rootScope.resourcesLoaded = false;

    if(engineResourceLoader.resources == 0)
        $rootScope.resourcesLoaded = true;
    else
        $rootScope.$on('engine.common.resourcesLoaded', function () {
            $rootScope.resourcesLoaded = true;
        })
});
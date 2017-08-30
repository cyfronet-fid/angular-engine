var app = angular.module('engine.list');

/**
 * This directive will save element width, which is usefull for tables, so their columns
 * won't change size
 */
app.directive('engSaveColWidth', function ($timeout) {
    var POSTLINK_TIMEOUT = 1000;
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            $timeout(function() {
                jQuery(element).css('width', jQuery(element).width() + 'px')
            }, POSTLINK_TIMEOUT)
            ;
        }
    }
});
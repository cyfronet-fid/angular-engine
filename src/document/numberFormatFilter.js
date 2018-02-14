/**
 * Created by marta on 2/14/18.
 */
angular.module('engine.document').filter('numberFormat', function ($translate) {
    return function (item) {
        var number = Number(item);
        if (!_.isNaN(number)) {
            return ( number.toLocaleString($translate.use()));
        } else {
            return (item);
        }
    }
});
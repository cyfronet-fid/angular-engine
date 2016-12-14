angular.module('engine.document')
.factory('ConditionBuilder', function ($engineApiCheck) {
    var _apiCheck = $engineApiCheck;

    return function (fieldCondition) {
        _apiCheck([_apiCheck.oneOfType([_apiCheck.func, _apiCheck.string, _apiCheck.object])], arguments);

        var rFieldCondition = null;

        if (_.isFunction(fieldCondition))
            rFieldCondition = fieldCondition;
        else {
            var _condition;
            if (_.isString(fieldCondition))
                _condition = {visualClass: fieldCondition};
            else
                _condition = fieldCondition;

            rFieldCondition = function (metric) {
                for (var metricAttribute in _condition) {
                    if (_.isArray(metric[metricAttribute]) && !_.contains(metric[metricAttribute], _condition[metricAttribute]))
                        return false;
                    else if (_.isString(metric[metricAttribute]) && metric[metricAttribute] != _condition[metricAttribute])
                        return false;
                    else if (metric[metricAttribute] == null)
                        return false;
                }
                return true;
            }
        }

        return rFieldCondition;
    };
});
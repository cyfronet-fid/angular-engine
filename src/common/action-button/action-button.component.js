app = angular.module('engine.common');

app.component('actionButton', {
    controller: function ($q) {
        var self = this;

        this.loading = false;

        this.invoke = function () {
            //do not allow for double clicks
            if(this.loading)
                return;

            this.loading = true;
            $q.when(this.onClick()).finally(function () {
                self.loading = false
            });
        }
    },
    templateUrl: '/src/common/action-button/action-button.tpl.html',
    bindings: {
        onClick: '&',
        label: '@',
        btnClass: '@'
    }
});
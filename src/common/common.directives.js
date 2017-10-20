var app = angular.module('engine.common');

app.directive('engIsolateForm', function IsolateFormDirective($timeout) {
  return {
    restrict: 'A',
    require: '?form',
    link: function link(scope, $element, attrs, formController) {

      if (!formController) {
        return;
      }

      $timeout(function () {
        // Remove this form from parent controller
        let parentFormController = $element.parent().controller('form');

        if (_.isUndefined(parentFormController))
          return;

        parentFormController.$removeControl(formController);

        // Replace form controller with a 'null-controller'
        let isolateFormCtrl = {
          $addControl: angular.noop,
          $removeControl: angular.noop,
          $setValidity: angular.noop,
          $setDirty: angular.noop,
          $setPristine: angular.noop
        };

        angular.extend(formController, isolateFormCtrl);
      });
    }
  };
});
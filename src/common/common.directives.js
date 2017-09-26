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
        var parentFormController = $element.parent().controller('form');
        parentFormController.$removeControl(formController);

        // Replace form controller with a 'null-controller'
        var isolateFormCtrl = {
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
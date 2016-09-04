'use strict';

describe('Controller: VncCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var VncCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    VncCtrl = $controller('VncCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(VncCtrl.awesomeThings.length).toBe(3);
  });
});

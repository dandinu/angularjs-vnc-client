'use strict';

describe('Service: VNCClient', function () {

  // load the service's module
  beforeEach(module('clientApp'));

  // instantiate service
  var VNCClient;
  beforeEach(inject(function (_VNCClient_) {
    VNCClient = _VNCClient_;
  }));

  it('should do something', function () {
    expect(!!VNCClient).toBe(true);
  });

});

'use strict';

const chai = require('chai');
const sinonChai = require("sinon-chai");

chai.use(sinonChai);

global.sinon = require('sinon');
global.chai = chai;
global.expect = chai.expect;

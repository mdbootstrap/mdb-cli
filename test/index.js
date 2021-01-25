'use strict';

// require('dotenv').config();

const chai = require('chai');
const sinonChai = require("sinon-chai");

chai.use(sinonChai);

global.chai = chai;
global.expect = chai.expect;

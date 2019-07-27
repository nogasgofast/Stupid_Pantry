/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./static/app.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./static/app.js":
/*!***********************!*\
  !*** ./static/app.js ***!
  \***********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _login_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./login.js */ \"./static/login.js\");\n/* harmony import */ var _catagoryView_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./catagoryView.js */ \"./static/catagoryView.js\");\nfunction _typeof(obj) { if (typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; }; } return _typeof(obj); }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }\n\nfunction _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }\n\nfunction _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === \"object\" || typeof call === \"function\")) { return call; } return _assertThisInitialized(self); }\n\nfunction _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return self; }\n\nfunction _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function\"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }\n\nfunction _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }\n\n\n\nvar e = React.createElement;\n\nvar componentRouter =\n/*#__PURE__*/\nfunction (_React$Component) {\n  _inherits(componentRouter, _React$Component);\n\n  function componentRouter(props) {\n    var _this;\n\n    _classCallCheck(this, componentRouter);\n\n    _this = _possibleConstructorReturn(this, _getPrototypeOf(componentRouter).call(this, props));\n    _this.state = {\n      routes: {\n        loginForm: _login_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"],\n        catagoryView: _catagoryView_js__WEBPACK_IMPORTED_MODULE_1__[\"default\"]\n      },\n      page: 'loginForm'\n    };\n    return _this;\n  }\n\n  _createClass(componentRouter, [{\n    key: \"navigate\",\n    value: function navigate(newPage) {\n      console.log(\"Fire!\");\n      this.setState({\n        page: newPage\n      });\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      var _this2 = this;\n\n      return e(this.state.routes[this.state.page], {\n        accessToken: this.state.accessToken,\n        refreshToken: this.state.refreshToken,\n        updateCallback: function updateCallback(access, refresh) {\n          return _this2.props.updateCallback(access, refresh);\n        },\n        navigate: function navigate(page) {\n          return _this2.navigate(page);\n        }\n      }, null);\n    }\n  }]);\n\n  return componentRouter;\n}(React.Component);\n\nvar App =\n/*#__PURE__*/\nfunction (_React$Component2) {\n  _inherits(App, _React$Component2);\n\n  function App(props) {\n    var _this3;\n\n    _classCallCheck(this, App);\n\n    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(App).call(this, props));\n    _this3.state = {\n      accessToken: '',\n      refreshToken: ''\n    };\n    return _this3;\n  }\n\n  _createClass(App, [{\n    key: \"updateAccessToken\",\n    value: function updateAccessToken(token) {\n      this.setState({\n        accessToken: token\n      });\n    }\n  }, {\n    key: \"updateAllTokens\",\n    value: function updateAllTokens(access, refresh) {\n      this.setState({\n        accessToken: access,\n        refreshToken: refresh\n      });\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      var _this4 = this;\n\n      return e(componentRouter, {\n        accessToken: this.state.accessToken,\n        efreshToken: this.state.refreshToken,\n        updateCallback: function updateCallback(access, refresh) {\n          return _this4.updateAllTokens(access, refresh);\n        }\n      }, null);\n    }\n  }]);\n\n  return App;\n}(React.Component); // ========================================\n\n\nReactDOM.render(e(App, null, null), document.getElementById('root'));\n\n//# sourceURL=webpack:///./static/app.js?");

/***/ }),

/***/ "./static/catagoryView.js":
/*!********************************!*\
  !*** ./static/catagoryView.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return CatagoryView; });\nfunction _typeof(obj) { if (typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; }; } return _typeof(obj); }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }\n\nfunction _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }\n\nfunction _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === \"object\" || typeof call === \"function\")) { return call; } return _assertThisInitialized(self); }\n\nfunction _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return self; }\n\nfunction _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function\"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }\n\nfunction _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }\n\nvar e = React.createElement;\n\nvar catagories =\n/*#__PURE__*/\nfunction (_React$Component) {\n  _inherits(catagories, _React$Component);\n\n  function catagories() {\n    _classCallCheck(this, catagories);\n\n    return _possibleConstructorReturn(this, _getPrototypeOf(catagories).apply(this, arguments));\n  }\n\n  _createClass(catagories, [{\n    key: \"render\",\n    value: function render() {\n      return e('ul', {\n        className: \"w3-ul\"\n      }, e('li', null, e('button', {\n        className: \"w3-button w3-hover-yellow\"\n      }, 'Cookbook')), e('li', null, e('button', {\n        className: \"w3-button w3-hover-yellow\"\n      }, 'Pantry')), e('li', null, e('button', {\n        className: \"w3-button w3-hover-yellow\"\n      }, 'Shopping')), e('li', null, e('button', {\n        className: \"w3-button w3-hover-yellow\"\n      }, 'Browsing')));\n    }\n  }]);\n\n  return catagories;\n}(React.Component);\n\nvar navHeader =\n/*#__PURE__*/\nfunction (_React$Component2) {\n  _inherits(navHeader, _React$Component2);\n\n  function navHeader() {\n    _classCallCheck(this, navHeader);\n\n    return _possibleConstructorReturn(this, _getPrototypeOf(navHeader).apply(this, arguments));\n  }\n\n  _createClass(navHeader, [{\n    key: \"render\",\n    value: function render() {\n      return e('div', {\n        className: \"w3-bar\"\n      }, e('button', {\n        className: \"fas fa-backward w3-yellow w3-xxlarge w3-bar-item\"\n      }, null), e('button', {\n        className: \"w3-col fas fa-forward w3-yellow w3-xxlarge w3-bar-item w3-right\"\n      }, null));\n    }\n  }]);\n\n  return navHeader;\n}(React.Component);\n\nvar CatagoryView =\n/*#__PURE__*/\nfunction (_React$Component3) {\n  _inherits(CatagoryView, _React$Component3);\n\n  function CatagoryView() {\n    _classCallCheck(this, CatagoryView);\n\n    return _possibleConstructorReturn(this, _getPrototypeOf(CatagoryView).apply(this, arguments));\n  }\n\n  _createClass(CatagoryView, [{\n    key: \"render\",\n    value: function render() {\n      return e('div', null, e(navHeader, null, null), e('div', {\n        className: \"w3-padding w3-row w3-container w3-center\"\n      }, e('div', {\n        className: \"w3-center w3-twothird w3-card w3-container\"\n      }, e('h1', null, 'Catagories'), e(catagories, null, null))));\n    }\n  }]);\n\n  return CatagoryView;\n}(React.Component);\n\n\n\n//# sourceURL=webpack:///./static/catagoryView.js?");

/***/ }),

/***/ "./static/login.js":
/*!*************************!*\
  !*** ./static/login.js ***!
  \*************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return LoginForm; });\nfunction _typeof(obj) { if (typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; }; } return _typeof(obj); }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }\n\nfunction _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }\n\nfunction _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === \"object\" || typeof call === \"function\")) { return call; } return _assertThisInitialized(self); }\n\nfunction _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }\n\nfunction _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return self; }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function\"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }\n\nfunction _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }\n\nvar e = React.createElement;\n\nfunction username(props) {\n  return e('input', {\n    type: \"text\",\n    className: \"w3-input w3-round w3-padding-16\",\n    value: props.username,\n    placeholder: \"username\",\n    name: \"username\",\n    onChange: props.onChange\n  }, null);\n}\n\n;\n\nfunction password(props) {\n  return e('input', {\n    type: \"password\",\n    className: \"w3-input w3-round w3-padding-16\",\n    value: props.password,\n    placeholder: \"password\",\n    name: \"password\",\n    onChange: props.onChange\n  }, null);\n}\n\nvar LoginForm =\n/*#__PURE__*/\nfunction (_React$Component) {\n  _inherits(LoginForm, _React$Component);\n\n  function LoginForm(props) {\n    var _this;\n\n    _classCallCheck(this, LoginForm);\n\n    _this = _possibleConstructorReturn(this, _getPrototypeOf(LoginForm).call(this, props));\n    _this.state = {\n      username: '',\n      password: ''\n    };\n    _this.handleChangeUser = _this.handleChangeUser.bind(_assertThisInitialized(_this));\n    _this.handleChangePass = _this.handleChangePass.bind(_assertThisInitialized(_this));\n    _this.handleSubmit = _this.handleSubmit.bind(_assertThisInitialized(_this));\n    return _this;\n  }\n\n  _createClass(LoginForm, [{\n    key: \"handleChangeUser\",\n    value: function handleChangeUser(event) {\n      this.setState({\n        username: event.target.value\n      });\n    }\n  }, {\n    key: \"handleChangePass\",\n    value: function handleChangePass(event) {\n      this.setState({\n        password: event.target.value\n      });\n    }\n  }, {\n    key: \"handleSubmit\",\n    value: function handleSubmit(event) {\n      var _this2 = this;\n\n      var username = this.state.username;\n      var password = this.state.password;\n      var xhr = new XMLHttpRequest();\n      var url = '/v1/auth';\n      xhr.open(\"POST\", url, true);\n      xhr.setRequestHeader(\"Content-Type\", \"application/json\");\n\n      xhr.onreadystatechange = function () {\n        return _this2.getAuthTokens(xhr);\n      };\n\n      var datas = JSON.stringify({\n        username: username,\n        password: password\n      });\n      xhr.send(datas);\n      event.preventDefault();\n    }\n  }, {\n    key: \"renderUsername\",\n    value: function renderUsername() {\n      var _this3 = this;\n\n      return username({\n        password: this.state.username,\n        onChange: function onChange(event) {\n          return _this3.handleChangeUser(event);\n        }\n      });\n    }\n  }, {\n    key: \"renderPassword\",\n    value: function renderPassword() {\n      var _this4 = this;\n\n      return password({\n        password: this.state.password,\n        onChange: function onChange(event) {\n          return _this4.handleChangePass(event);\n        }\n      });\n    }\n  }, {\n    key: \"getAuthTokens\",\n    value: function getAuthTokens(xhr) {\n      if (xhr.readyState == 4 && xhr.status == 200) {\n        console.log(xhr.responseText);\n        var json = JSON.parse(xhr.responseText);\n        this.props.updateCallback(json.access_token, json.refresh_token);\n        this.props.navigate('catagoryView');\n      } else if (this.readyState == 4) {\n        console.log(this.readyState + \" \" + this.status + \" \" + xhr.responseText);\n      }\n    }\n  }, {\n    key: \"render\",\n    value: function render() {\n      var _this5 = this;\n\n      return e('div', {\n        className: \"w3-display\"\n      }, e('form', {\n        className: \"w3-display-middle \" + \"w3-card \" + \"w3-round \" + \"w3-form \",\n        onSubmit: function onSubmit(event) {\n          return _this5.handleSubmit(event);\n        }\n      }, e('div', {\n        className: \"w3-container\"\n      }, e('h2', null, 'Login'), e('label', {\n        htmlFor: \"username\",\n        hidden: true\n      }, 'username:'), this.renderUsername(), e('label', {\n        htmlFor: \"password\",\n        hidden: true\n      }, 'password:'), this.renderPassword(), e('div', {\n        className: \"w3-container w3-center w3-padding-16\"\n      }, e('input', {\n        type: \"submit\",\n        value: \"Log in\",\n        readOnly: true,\n        className: \"w3-btn w3-yellow w3-input\"\n      }, null), e('a', {\n        className: \"w3-btn\",\n        href: '/register'\n      }, \"Sign up here!\")))));\n    }\n  }]);\n\n  return LoginForm;\n}(React.Component);\n\n\n\n//# sourceURL=webpack:///./static/login.js?");

/***/ })

/******/ });
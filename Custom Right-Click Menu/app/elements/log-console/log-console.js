﻿(function() {
	var el = React.DOM;

	var line = React.createClass({
		openTab: function() {

		},

		render: function() {
			return (
				el.div({
					className: 'line',
					error: this.value.type === 'error',
				},
					el.div({
						className: 'lineData',
					},
						el.div({
							className: 'lineTimestamp'
						}, 
							this.timestamp
							),
						el.div({
							className: 'lineContent'
							})
						),
					el.div({
						className: 'lineSource'
					},
						el.span({
							className: 'lineSourceIdCont',
							title: this.nodeTitle
						},
							'[id-',
							el.span({
								className: 'lineSourceId'
							},
								this.id
								)
							),
						el.span({
							className: 'lineSourceTabCont',
							onClick: this.openTab
						})
						)
					)
				)
		}
	});

	console.log(x);

	Polymer({
		is: 'log-console',

		bgPage: null,

		properties: {
			lines: {
				type: Array,
				value: [],
				notify: true
			},
			ids: {
				type: Array,
				value: [],
				notify: true
			},
			selectedId: {
				type: Number,
				notify: true,
				value: 0
			},
			selectedTab: {
				type: Number,
				notify: true,
				value: 0
			},
			tabs: {
				type: Array,
				value: [],
				notify: true
			},
			variables: {
				type: Array,
				value: []
			},
			textfilter: {
				type: String,
				value: '',
				notify: true
			},
			waitingForEval: {
				type: Boolean,
				value: false,
				notify: true
			},
			_this: {

			}
		},

		observers: [
			'_updateLog(selectedId, selectedTab, textfilter)'
		],

		_hideGenericToast: function() {
			this.$.genericToast.hide();
		},

		_textFilterChange: function() {
			this.set('textfilter', this.$.textFilter.value);
		},

		_takeToTab: function(event) {
			var _this = this;
			var target = event.target;
			var tabId = target.children[0].innerText;
			
			chrome.tabs.get(~~tabId, function(tab) {
				if (chrome.runtime.lastError) {
					_this.$.genericToast.text = 'Tab has been closed';
					_this.$.genericToast.show();
					return;
				}

				chrome.tabs.highlight({
					windowId: tab.windowId,
					tabs: tab.index
				});
			});
		},

		_focusInput: function() {
			this.$.consoleInput.focus();
		},

		_fixTextareaLines: function() {
			this.$.consoleInput.setAttribute('rows', (this.$.consoleInput.value.split('\n').length || 1));
			this.$.linesCont.scrollTop = this.$.linesCont.scrollHeight;
		},

		_executeCode: function(code) {
			if (this.selectedTab !== 0 && this.selectedId !== 0) {
				var tabVal = this.tabs[~~this.selectedTab - 1];
				chrome.runtime.sendMessage({
					type: 'executeCRMCode',
					data: {
						code: code,
						id: ~~this.ids[this.selectedId - 1],
						tab: tabVal === 'background' ? tabVal : ~~tabVal,
						logListener: this._logListener
					}
				});
				this.waitingForEval = true;
			} else {
				this.$.inputFieldWarning.classList.add('visible');
				this.$.consoleInput.setAttribute('disabled', 'disabled');
				this.async(function() {
					this.$.inputFieldWarning.classList.remove('visible');
					this.$.consoleInput.removeAttribute('disabled');
				}, 5000);
			}
		},

		_inputKeypress: function(event) {
			if (event.key === 'Enter') {
				if (!event.shiftKey) {
					this._executeCode(this.$.consoleInput.value);
					this.$.consoleInput.value = '';
					this.$.consoleInput.setAttribute('rows', 1);
				} else {
					this.async(this._fixTextareaLines, 10);
				}
			} else if (event.key === 'Backspace' || event.key === 'Delete') {
				this.async(this._fixTextareaLines, 10);
			}
			this.$.linesCont.scrollTop = this.$.linesCont.scrollHeight;
		},

		_updateLog: function(selectedId, selectedTab, textfilter) {
			var tabVal = this.tabs && this.tabs[~~selectedTab - 1];
			this.lines = (this._logListener && this._logListener.update(
				~~this.ids[~~selectedId - 1], 
				tabVal === 'background' ? tabVal : ~~tabVal,
				textfilter
			)) || [];
		},

		_getTotalLines: function(lines) {
			return lines.length;
		},

		_getIdTabs: function(selectedId, tabs) {
			if (~~selectedId === 0) {
				return tabs;
			}
			if (this.bgPage) {
				return this.bgPage._getIdCurrentTabs(~~this.ids[~~selectedId - 1]);
			} else {
				return [];
			}
		},

		_escapeHTML: function(string) {
			return string
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');
		},

		_processLine: function(line) {
			var _this = this;
			line.content = _this._specialJSON.fromJson(line.value).map(function(value) {
				var result = {
					value: value
				};
				switch (typeof value) {
					case 'function':
						result.tag = 'function';
						result.value = value.toString();
						break;
					case 'object':
						if (Array.isArray(value)) {
							result.tag = 'array';
						} else {
							result.tag = 'object';
						}
						break;
					default:
						result.tag = 'string';
						break;
				}
				return result;
			});
			return line;
		},

		_processEvalLine: function(line) {
			var _this = this;
			var lastEval = Array.prototype.slice.apply(
				this.querySelectorAll('log-eval')).pop();
			if (line.value.type === 'error') {
				line.isError = true;
				lastEval.result = '<log-error data="' +
					_this._escapeHTML(_this._specialJSON.fromJson(line.result)) +
					'"></log-error>';
			} else {
				line.value = JSON.parse(line.value.result);
				lastEval.result = this._processLine(line).content;  
			}
			lastEval.done = true;
			
			this.waitingForEval = false;
		},

		_generateLine: function(lineValue) {
			var line = document.createElement('div');
			line.classList.add('line');

			line.innerHTML = [
				'<div class="lineData">',
					'<div class="lineTimestamp">[[line.timestamp]]</div>',
					'<div class="lineContent"></div>',
				'</div>',
				'<div class="lineSource">',
					'<span class="lineSourceIdCont" title="' + lineValue.nodeTitle + 
					'">[id-<span class="lineSourceId">' + lineValue.id +
					'</span>]</span><span class="lineSourceTabCont" tabindex="1" title="' + 
					lineValue.tabTitle + '">[tab-<span class="lineSourceTab">' + 
					lineValue.tabId + '</span>]</span><span class="lineSourceLineCont">' + 
					'@<span class="lineSourceLineNumber">' + lineValue.lineNumber.trim() + '</span></span>',
				'</div>'].join('\n');
			line.querySelector('.lineSourceTabCont').addEventListener('click', this._takeToTab);

			return {
				line: line,
				lineCont: line.querySelector('.lineContent')
			}
		},

		_generateHTML: function(lineValue) {
			var _this = this;
			var lineResult = this._generateLine(lineValue);

			var line = lineResult.line;
			var lineCont = lineResult.lineCont;
			
			this.specialJSON.fromJson(line.value).map(function(value) {
				switch (typeof value) {
					case 'function':
						result.tag = 'function';
						result.value = value.toString();
						break;
					case 'object':
						if (Array.isArray(value)) {
							result.tag = 'array';
						} else {
							result.tag = 'object';
						}
						break;
					default:
						result.tag = 'string';
						break;
				}
				return value;
			}).forEach(function(value) {
				lineCont.appendChild(value);
			});

			return line;
		},

		_init: function(onDone) {
			var _this = this;
			chrome.runtime.getBackgroundPage(function(bgPage) {
				_this.bgPage = bgPage;

				bgPage._listenIds(function(ids) {
					_this.set('ids', ids.map(function(id) {
						return Number(id);
					}));
				});
				bgPage._listenTabs(function(tabs) {
					_this.set('tabs', tabs);
				});
				_this.set('lines', bgPage._listenLog(function(logLine) {
					if (logLine.type && logLine.type === 'evalResult') {
						_this.push('lines', _this._processEvalLine(logLine));
					} else {
						this.$.lines.appendChild(_this._generateHTML(logLine));
						//_this.push('lines', _this._processLine(logLine));
					}
				}, function(logListener) {
					_this._logListener = logListener;
				}).map(function(logLine) {
					return _this._processLine(logLine);
				}));
			});

			this.async(function() {
				var menus = Array.prototype.slice.apply(document.querySelectorAll('paper-dropdown-menu'));
				menus.forEach(function(menu) {
					menu.onopen = function() {
						menu.querySelector('template').render();
						_this.async(function() {
							menu.refreshListeners.apply(menu);
						}, 100);
					}
					menu.onchange = function(oldState, newState) {
						menus.forEach(function(menu) {
							menu.close();
						});

						if (menu.id === 'idDropdown') {
							_this.set('selectedId', newState);
						} else {
							_this.set('selectedTab', newState);
						}
					};
				});
			}, 1000);
		},

		ready: function() {
			var _this = this;
			this._this = this;
			window.logConsole = this;

			this.async(function() {
				this._init(function() {
					this.done = true;

					if (window.logPage) {
						window.logPage.isLoading = false;
					}
				});
			}, 1000);
		},

		_specialJSON: {
			resolveJson: function(root, args){
				args = args || {};
				var idAttribute = args.idAttribute || 'id';
				var refAttribute = this.refAttribute;
				var idAsRef = args.idAsRef;
				var prefix = args.idPrefix || ''; 
				var assignAbsoluteIds = args.assignAbsoluteIds;
				var index = args.index || {}; // create an index if one doesn't exist
				var timeStamps = args.timeStamps;
				var ref,reWalk=[];
				var pathResolveRegex = /^(.*\/)?(\w+:\/\/)|[^\/\.]+\/\.\.\/|^.*\/(\/)/;
				var addProp = this._addProp;
				var F = function(){};
				function walk(it, stop, defaultId, needsPrefix, schema, defaultObject){
					// this walks the new graph, resolving references and making other changes
					var i, update, val, id = idAttribute in it ? it[idAttribute] : defaultId;
					if(idAttribute in it || ((id !== undefined) && needsPrefix)){
						id = (prefix + id).replace(pathResolveRegex,'$2$3');
					}
					var target = defaultObject || it;
					if(id !== undefined){ // if there is an id available...
						if(assignAbsoluteIds){
							it.__id = id;
						}
						if(args.schemas && (!(it instanceof Array)) && // won't try on arrays to do prototypes, plus it messes with queries 
									(val = id.match(/^(.+\/)[^\.\[]*$/))){ // if it has a direct table id (no paths)
							schema = args.schemas[val[1]];
						} 
						// if the id already exists in the system, we should use the existing object, and just 
						// update it... as long as the object is compatible
						if(index[id] && ((it instanceof Array) == (index[id] instanceof Array))){ 
							target = index[id];
							delete target.$ref; // remove this artifact
							delete target._loadObject;
							update = true;
						}else{
							var proto = schema && schema.prototype; // and if has a prototype
							if(proto){
								// if the schema defines a prototype, that needs to be the prototype of the object
								F.prototype = proto;
								target = new F();
							}
						}
						index[id] = target; // add the prefix, set _id, and index it
						if(timeStamps){
							timeStamps[id] = args.time;
						}
					}
					while(schema){
						var properties = schema.properties;
						if(properties){
							for(i in it){
								var propertyDefinition = properties[i];
								console.log(it);
								if(propertyDefinition && propertyDefinition.format == 'date-time' && typeof it[i] == 'string'){
									it[i] = new Date(it[i]);
								}
							}
						}
						schema = schema["extends"];
					}
					var length = it.length;
					for(i in it){
						if(i==length){
							break;		
						}
						if(it.hasOwnProperty(i)){
							val=it[i];
							if((typeof val =='object') && val && !(val instanceof Date) && i != '__parent'){
								ref=val[refAttribute] || (idAsRef && val[idAttribute]);
								if(!ref || !val.__parent){
									val.__parent = it;
								}
								if(ref){ // a reference was found
									// make sure it is a safe reference
									delete it[i];// remove the property so it doesn't resolve to itself in the case of id.propertyName lazy values
									var path = ref.toString().replace(/(#)([^\.\[])/,'$1.$2').match(/(^([^\[]*\/)?[^#\.\[]*)#?([\.\[].*)?/); // divide along the path
									if((ref = (path[1]=='$' || path[1]=='this' || path[1]=='') ? root : index[(prefix + path[1]).replace(pathResolveRegex,'$2$3')])){  // a $ indicates to start with the root, otherwise start with an id
										// if there is a path, we will iterate through the path references
										if(path[3]){
											path[3].replace(/(\[([^\]]+)\])|(\.?([^\.\[]+))/g,function(t,a,b,c,d){
												ref = ref && ref[b ? b.replace(/[\"\'\\]/,'') : d];
											});
										}
									}
									if(ref){
										val = ref;
									}else{
										// otherwise, no starting point was found (id not found), if stop is set, it does not exist, we have
										// unloaded reference, if stop is not set, it may be in a part of the graph not walked yet,
										// we will wait for the second loop
										if(!stop){
											var rewalking;
											if(!rewalking){
												reWalk.push(target); // we need to rewalk it to resolve references
											}
											rewalking = true; // we only want to add it once
											val = walk(val, false, val[refAttribute], true, propertyDefinition);
											// create a lazy loaded object
											val._loadObject = args.loader;
										}
									}
								}else{
									if(!stop){ // if we are in stop, that means we are in the second loop, and we only need to check this current one,
										// further walking may lead down circular loops
										val = walk(
											val,
											reWalk==it,
											id === undefined ? undefined : addProp(id, i), // the default id to use
											false,
											propertyDefinition, 
											// if we have an existing object child, we want to 
											// maintain it's identity, so we pass it as the default object
											target != it && typeof target[i] == 'object' && target[i] 
										);
									}
								}
							}
							it[i] = val;
							if(target!=it && !target.__isDirty){// do updates if we are updating an existing object and it's not dirty				
								var old = target[i];
								target[i] = val; // only update if it changed
								if(update && val !== old && // see if it is different 
										!target._loadObject && // no updates if we are just lazy loading
										!(i.charAt(0) == '_' && i.charAt(1) == '_') && i != "$ref" &&  
										!(val instanceof Date && old instanceof Date && val.getTime() == old.getTime()) && // make sure it isn't an identical date
										!(typeof val == 'function' && typeof old == 'function' && val.toString() == old.toString()) && // make sure it isn't an indentical function
										index.onUpdate){
									index.onUpdate(target,i,old,val); // call the listener for each update
								}
							}
						}
					}
			
					if(update && (idAttribute in it)){
						// this means we are updating with a full representation of the object, we need to remove deleted
						for(i in target){
							if(!target.__isDirty && target.hasOwnProperty(i) && !it.hasOwnProperty(i) && !(i.charAt(0) == '_' && i.charAt(1) == '_') && !(target instanceof Array && isNaN(i))){
								if(index.onUpdate && i != "_loadObject" && i != "_idAttr"){
									index.onUpdate(target,i,target[i],undefined); // call the listener for each update
								}
								delete target[i];
								while(target instanceof Array && target.length && target[target.length-1] === undefined){
									// shorten the target if necessary
									target.length--;
								}
							}
						}
					}else{
						if(index.onLoad){
							index.onLoad(target);
						}
					}
					return target;
				}
				if(root && typeof root == 'object'){
					root = walk(root,false,args.defaultId, true); // do the main walk through
					walk(reWalk,false); // re walk any parts that were not able to resolve references on the first round
				}
				return root;
			},

			fromJson: function(str, args){
				function ref(target){
					var refObject = {};
					refObject[this.refAttribute] = target;
					return refObject;
				}
				try{
					var root = eval('(' + str + ')');
				}catch(e){
					throw new SyntaxError("Invalid JSON string: " + e.message + " parsing: "+ str);
				}		
				if(root){
					return this.resolveJson(root, args);
				}
				return root;
			},
			
			_addProp: function(id, prop){
				return id + (id.match(/#/) ? id.length == 1 ? '' : '.' : '#') + prop;
			},
			refAttribute: "$ref",
			_useRefs: false,
			serializeFunctions: true
		}
	});
}());
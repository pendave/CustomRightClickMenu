﻿Polymer({
	is: 'stylesheet-edit',

	//#region PolymerProperties
	/**
	* AN interval to save any work not discarder or saved (say if your browser/pc crashes)
	* 
	* @attribute savingInterval
	* @type Object
	* @default null
	*/
	savingInterval: false,

	/**
	* Whether this thing is active
	* 
	* @attribute active
	* @type Boolean
	* @default false
	*/
	active: false,

	/**
	* The editor
	* 
	* @attribute editor
	* @type Object
	* @default null
	*/
	editor: null,

	/**
     * Whether the vertical scrollbar is already shown
     * 
     * @attribute verticalVisible
     * @type Boolean
     * @default false
     */
	verticalVisible: false,

	/**
     * Whether the horizontal scrollbar is already shown
     * 
     * @attribute horizontalVisible
     * @type Boolean
     * @default false
     */
	horizontalVisible: false,

	/**
     * The settings element on the top-right of the editor
     * 
     * @attribute settingsEl
     * @type Element
     * @default null
     */
	settingsEl: null,

	/**
     * The fullscreen element on the bottom-right of the editor
     * 
     * @attribute fullscreenEl
     * @type Element
     * @default null
     */
	fullscreenEl: null,

	/**
     * The container of the fullscreen and settings buttons
     * 
     * @attribute buttonsContainer
     * @type Element
     * @default null
     */
	buttonsContainer: null,
	/**
     * The editor's starting height
     * 
     * @attribute editorHeight
     * @type Number
     * @default 0
     */
	editorHeight: 0,

	/**
     * The editor's starting width
     * 
     * @attribute editorWidth
     * @type Number
     * @default 0
     */
	editorWidth: 0,

	/**
     * Whether to show the trigger editing section
     * 
     * @attribute showTriggers
     * @type Boolean
     * @default false
     */
	showTriggers: false,

	/**
     * Whether the options are shown
     * 
     * @attribute optionsShown
     * @type Boolean
     * @default false
     */
	optionsShown: false,

	/**
     * Whether the editor is in fullscreen mode
     * 
     * @attribute fullscreen
     * @type Boolean
     * @default false
     */
	fullscreen: false,

	/**
     * The element that contains the editor's options
     * 
     * @attribute editorOptions
     * @type Element
     * @default null
     */
	editorOptions: null,

	/**
     * The settings shadow element which is the circle on options
     * 
     * @attribute settingsShadow
     * @type Element
     * @default null
     */
	settingsShadow: null,

	/**
     * The editor's settings before going to the settings page
     * 
     * @attribute unchangedEditorSettings
     * @type Object
     * @default {}
     */
	unchangedEditorSettings: {},

	/**
     * The editor's dimensions before it goes fullscreen
     * 
     * @attribute preFullscreenEditorDimensions
     * @type Object
     * @default {}
     */
	preFullscreenEditorDimensions: {},

	//#region Animations
	/**
	 * The fullscreen animation
	 *
	 * @attribute fullscreenAnimation
	 * @type Animation
	 * @default null
	 */
	fullscreenAnimation: null,

	/**
	 * The show options animation player
	 *
	 * @attribute optionsAnimations
	 * @type Array
	 * @default []
	 */
	optionsAnimations: [],

	/**
	 * The dropdown to right animation
	 *
	 * @attribute dropdownToRightAnimation
	 * @type Animation
	 * @default null
	 */
	dropdownToRightAnimation: null,

	/**
	 * The dropdown to top animation
	 *
	 * @attribute dropdownToTopAnimation
	 * @type Animation
	 * @default null
	 */
	dropdownToTopAnimation: null,

	/**
	 * The animation for the editor's placeholder
	 *
	 * @attribute editorPlaceHolderAnimation
	 * @type Animation
	 * @default null
	 */
	editorPlaceHolderAnimation: null,

	properties: {
		/**
		 * The new settings object, to be written on save
		 * 
		 * @attribute newSettings
		 * @type Object
		 * @default {}
		 */
		newSettings: {
			type: Object,
			value: {},
			notify: true
		}
	},

	//#endregion

	//#endregion

	cancelChanges: function () {
		this.active = false;
		window.externalEditor.cancelOpenFiles();
		window.crmEditPage.animateOut();
	},

	getTriggers: function () {
		var inputs = $(window.scriptEdit).find('.executionTrigger').find('paper-input');
		var triggers = [];
		for (var i = 0; i < inputs.length; i++) {
			triggers[i] = inputs[i].value;
		}
		this.newSettings.value.triggers = triggers;
	},

	saveChanges: function () {
		this.active = false;
		window.externalEditor.cancelOpenFiles();
		var lookedUp = window.options.crm.lookup(this.item.path, true);
		this.getTriggers();
		window.crmEditPage.animateOut();
		lookedUp[this.item.path[this.item.path.length - 1]] = this.newSettings;
		options.upload();
	},

	/*
	 * Clears the trigger that is currently clicked on
	 * @param {event} The - event that triggers this (click event)
	 */
	clearTrigger: function (e) {
		var target = e.target;
		if (target.tagName === 'PAPER-ICON-BUTTON') {
			target = target.children[0];
		}
		$(target.parentNode.parentNode).remove();
		var executionTriggers = $(this.$.executionTriggersContainer).find('paper-icon-button').toArray();
		if (executionTriggers.length === 1) {
			executionTriggers[0].style.display = 'none';
		} else {
			executionTriggers.forEach(function (item) {
				item.style.display = 'block';
			});
		}
	},

	/*
	 * Adds a trigger to the list of triggers for the script
	 */
	addTrigger: function () {
		var _this = this;
		var newEl = $('<div class="executionTrigger"><paper-input class="triggerInput" value="example.com"></paper-input><paper-icon-button on-tap="clearTrigger" icon="clear"></paper-icon-button></div>').insertBefore(this.$.addTrigger);
		newEl.find('paper-icon-button').click(function (e) {
			_this.clearTrigger.apply(_this, [e]);
		});
		var executionTriggers = $(this.$.executionTriggersContainer).find('paper-icon-button').toArray();
		if (executionTriggers.length === 2) {
			executionTriggers[0].style.display = 'block';
		}
	},

	//#region fullscreen
	/*
	 * Inserts given snippet of code into the editor
	 * @param {element} _this The scriptEdit element/object
	 * @param {string} snippet - The snippet to be pasted
	 */
	insertSnippet: function (_this, snippet) {
		this.editor.doc.replaceSelection(snippet.replace('%s', this.editor.doc.getSelection()));
	},

	/*
	 * Pops in the ribbons with an animation
	 */
	popInRibbons: function () {
		//Introduce title at the top
		var scriptTitle = window.options.$.editorCurrentScriptTitle;
		scriptTitle.style.display = 'block';
		var scriptTitleAnimation = [
			{
				marginTop: '-51px'
			}, {
				marginTop: 0
			}
		];
		if (window.options.settings.editor.showToolsRibbon) {
			scriptTitle.style.marginLeft = '-200px';
			scriptTitleAnimation[0].marginLeft = '-200px';
			scriptTitleAnimation[1].marginLeft = 0;

			setTimeout(function () {
				window.doc.editorToolsRibbon.style.display = 'block';
				window.doc.editorToolsRibbon.animate([
					{
						marginLeft: '-200px'
					}, {
						marginLeft: 0
					}
				], {
					duration: 500,
					easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
				}).onfinish = function () {
					window.doc.editorToolsRibbon.style.marginLeft = 0;
					window.doc.editorToolsRibbon.classList.add('visible');
				};
			}, 200);
		}
		setTimeout(function () {
			$(window.doc.dummy).animate({
				height: '50px'
			}, {
				duration: 500,
				easing: $.bez([0.215, 0.610, 0.355, 1.000]),
				step: function (now) {
					window.doc.fullscreenEditorHorizontal.style.height = 'calc(100vh - ' + now + 'px)';
				}
			});
			scriptTitle.animate(scriptTitleAnimation, {
				duration: 500,
				easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
			}).onfinish = function () {
				scriptTitle.style.marginTop = 0;
				if (scriptTitleAnimation[0].marginLeft !== undefined) {
					scriptTitle.style.marginLeft = 0;
				}
			};
		}, 200);
	},

	/*
	 * Pops in only the tools ribbon
	 */
	popInToolsRibbon: function () {
		window.doc.editorToolsRibbon.style.display = 'block';
		window.doc.editorToolsRibbon.animate([
			{
				marginLeft: '-200px'
			}, {
				marginLeft: 0
			}
		], {
			duration: 800,
			easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
		}).onfinish = function () {
			this.effect.target.style.marginLeft = 0;
		}
	},

	/*
	 * Pops out only the tools ribbon
	 */
	popOutToolsRibbon: function () {
		$('#editorToolsRibbon')[0].animate([
			{
				marginLeft: 0
			}, {
				marginLeft: '-200px'
			}
		], {
			duration: 800,
			easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
		}).onfinish = function () {
			this.effect.target.style.marginLeft = '-200px';
			this.effect.target.classList.remove('visible');
		};
	},

	/*
	 * Pops out the ribbons with an animation
	 */
	popOutRibbons: function () {
		var scriptTitle = window.options.$.editorCurrentScriptTitle;
		var toolsRibbon = window.options.$.editorToolsRibbon;
		if (window.options.settings.editor.showToolsRibbon && toolsRibbon && toolsRibbon.classList.contains('visible')) {
			scriptTitle.animate([
				{
					marginTop: 0,
					marginLeft: 0
				}, {
					marginTop: '-51px',
					marginLeft: '-200px'
				}
			], {
				duration: 800,
				easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
			}).onfinish = function () {
				scriptTitle.style.marginTop = '-51px';
				scriptTitle.style.marginLeft = '-200px';
			};
			toolsRibbon.animate([
				{
					marginLeft: 0
				}, {
					marginLeft: '-200px'
				}
			], {
				duration: 800,
				easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
			}).onfinish = function () {
				scriptTitle.style.display = 'none';
				toolsRibbon.style.display = 'none';
				toolsRibbon.style.marginLeft = '-200px';
			};
		}
		else {
			window.doc.dummy.style.height = '50px';
			$(window.doc.dummy).animate({
				height: 0
			}, {
				duration: 800,
				easing: $.bez([0.215, 0.610, 0.355, 1.000]),
				step: function (now) {
					window.doc.fullscreenEditorHorizontal.style.height = 'calc(100vh - ' + now + 'px)';
				}
			});
			scriptTitle.animate([
				{
					marginTop: 0
				}, {
					marginTop: '-51px'
				}
			], {
				duration: 800,
				easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
			}).onfinish = function () {
				this.effect.target.remove();
				scriptTitle.style.display = 'none';
				toolsRibbon.style.display = 'none';
				scriptTitle.style.marginTop = '-51px';
				toolsRibbon.remove();
			}
		}
	},

	/*
	 * Enters fullscreen mode for the editor
	 */
	enterFullScreen: function () {
		var _this = this;
		var rect = this.editor.display.wrapper.getBoundingClientRect();
		var editorCont = window.doc.fullscreenEditor;
		var editorContStyle = editorCont.style;
		editorContStyle.marginLeft = this.preFullscreenEditorDimensions.marginLeft = rect.left + 'px';
		editorContStyle.marginTop = this.preFullscreenEditorDimensions.marginTop = rect.top + 'px';
		editorContStyle.height = this.preFullscreenEditorDimensions.height = rect.height + 'px';
		editorContStyle.width = this.preFullscreenEditorDimensions.width = rect.width + 'px';
		this.fullscreenEl.children[0].innerHTML = '<path d="M10 32h6v6h4V28H10v4zm6-16h-6v4h10V10h-4v6zm12 22h4v-6h6v-4H28v10zm4-22v-6h-4v10h10v-4h-6z"/>';
		//this.fullscreenEl.style.display = 'none';
		var $editorWrapper = $(this.editor.display.wrapper);
		var buttonShadow = $editorWrapper.find('#buttonShadow')[0];
		buttonShadow.style.position = 'absolute';
		buttonShadow.style.right = '-1px';
		this.editor.display.wrapper.classList.add('fullscreen');

		$editorWrapper.appendTo(window.doc.fullscreenEditorHorizontal);
		var $horizontalCenterer = $('#horizontalCenterer');
		var viewportWidth = $horizontalCenterer.width();
		var viewPortHeight = $horizontalCenterer.height();

		$editorWrapper[0].style.height = 'auto';
		document.documentElement.style.overflow = 'hidden';

		editorCont.style.display = 'flex';
		//Animate to corners
		$(editorCont).animate({
			width: viewportWidth,
			height: viewPortHeight,
			marginTop: 0,
			marginLeft: 0
		}, {
			duration: 500,
			easing: 'easeOutCubic',
			complete: function () {
				_this.editor.refresh();
				this.style.width = '100vw';
				this.style.height = '100vh';
				buttonShadow.style.position = 'fixed';
				options.$.fullscreenEditorHorizontal.style.height = '100vh';
				_this.popInRibbons();
			}
		});
	},

	/*
	 * Exits the editor's fullscreen mode
	 */
	exitFullScreen: function () {
		var _this = this;
		this.popOutRibbons();
		var $wrapper = $(_this.editor.display.wrapper);
		var $buttonShadow = $wrapper.find('#buttonShadow');
		$buttonShadow[0].style.position = 'absolute';
		setTimeout(function () {
			_this.editor.display.wrapper.classList.remove('fullscreen');
			var editorCont = window.doc.fullscreenEditor;
			_this.fullscreenEl.children[0].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M14 28h-4v10h10v-4h-6v-6zm-4-8h4v-6h6v-4H10v10zm24 14h-6v4h10V28h-4v6zm-6-24v4h6v6h4V10H28z"/></svg>';
			$(editorCont).animate({
				width: _this.preFullscreenEditorDimensions.width,
				height: _this.preFullscreenEditorDimensions.height,
				marginTop: _this.preFullscreenEditorDimensions.marginTop,
				marginLeft: _this.preFullscreenEditorDimensions.marginLeft
			}, {
				duration: 500,
				easing: 'easeOutCubic',
				complete: function () {
					editorCont.style.marginLeft = 0;
					editorCont.style.marginTop = 0;
					editorCont.style.width = 0;
					editorCont.style.height = 0;
					$(_this.editor.display.wrapper).appendTo(_this.$.editorCont).css({
						height: _this.preFullscreenEditorDimensions.height,
						marginTop: 0,
						marginLeft: 0
					});
				}
			});
		}, 800);
	},

	/*
	 * Toggles fullscreen mode for the editor
	 */
	toggleFullScreen: function () {
		(this.fullscreen ? this.exitFullScreen() : this.enterFullScreen());
		this.fullscreen = !this.fullscreen;
	},
	//#endregion

	//#region options
	/*
	 * Shows the options for the editor
	 */
	showOptions: function () {
		var _this = this;
		this.unchangedEditorSettings = jQuery.extend(true, {}, window.options.settings.editor);
		var editorWidth = $('.CodeMirror').width();
		var editorHeight = $('.CodeMirror').height();
		var circleRadius;

		//Add a bit just in case
		if (this.fullscreen) {
			circleRadius = Math.sqrt((250000) + (editorHeight * editorHeight)) + 100;
		} else {
			circleRadius = Math.sqrt((editorWidth * editorWidth) + (editorHeight * editorHeight)) + 100;
		}
		var negHalfRadius = -circleRadius;
		circleRadius = circleRadius * 2;
		this.settingsShadow[0].parentNode.style.width = editorWidth;
		this.settingsShadow[0].parentNode.style.height = editorHeight;
		this.fullscreenEl.style.display = 'none';
		var settingsInitialMarginLeft = (window.options.settings.editor.lineNumbers ? -500 : -470);
		$('#editorThemeFontSizeInput')[0].value = window.options.settings.editor.zoom;
		this.settingsShadow.css({
			width: '50px',
			height: '50px',
			borderRadius: '50%',
			marginTop: '-25px',
			marginRight: '-25px'
		}).animate({
			width: circleRadius,
			height: circleRadius,
			marginTop: negHalfRadius,
			marginRight: negHalfRadius
		}, {
			duration: 500,
			easing: 'linear',
			progress: function (animation) {
				_this.editorOptions[0].style.marginLeft = (settingsInitialMarginLeft - animation.tweens[3].now) + 'px';
				_this.editorOptions[0].style.marginTop = -animation.tweens[2].now + 'px';
			}
		});
	},

	/*
	 * Hides the options for the editor
	 */
	hideOptions: function () {
		var _this = this;
		var settingsInitialMarginLeft = (window.options.settings.editor.lineNumbers ? -500 : -470);
		this.fullscreenEl.style.display = 'block';
		this.settingsShadow.animate({
			width: 0,
			height: 0,
			marginTop: 0,
			marginRight: 0
		}, {
			duration: 500,
			easing: 'linear',
			progress: function (animation) {
				_this.editorOptions[0].style.marginLeft = (settingsInitialMarginLeft - animation.tweens[3].now) + 'px';
				_this.editorOptions[0].style.marginTop = -animation.tweens[2].now + 'px';
			},
			complete: function () {
				var zoom = window.options.settings.editor.zoom;
				var prevZoom = _this.unchangedEditorSettings.zoom;
				_this.unchangedEditorSettings.zoom = zoom;
				if (JSON.stringify(_this.unchangedEditorSettings) !== JSON.stringify(window.options.settings.editor)) {
					_this.reloadEditor();
				}
				if (zoom !== prevZoom) {
					window.options.updateEditorZoom();
				}
			}
		});
	},

	/*
	 * Toggles the editor's options
	 */
	toggleOptions: function () {
		(this.optionsShown ? this.hideOptions() : this.showOptions());
		this.optionsShown = !this.optionsShown;
	},
	//#endregion

	/*
	 * Is triggered when the option "Execute when visiting specified sites" is 
	 * selected in the triggers dropdown menu and animates the specified sites in
	 */
	selectorStateChange: function (state) {
		var _this = this;
		var show = (state === 2 || state === '2');
		if (show !== this.showTriggers) {
			var element = $(this.$.executionTriggersContainer);
			var domElement = element[0];
			var originalHeight = element.height();
			if (show) {
				domElement.style.height = 'auto';
				domElement.style.display = 'block';

				if (this.dropdownToTopAnimation) {
					this.dropdownToTopAnimation.show = true;
					this.dropdownToRightAnimation.hide = false;
					this.dropdownToTopAnimation.reverse();
				}
				else {
					this.dropdownToTopAnimation = domElement.animate([
						{
							height: 0
						}, {
							height: originalHeight
						}
					], {
						duration: 300,
						easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
						fill: 'both'
					});
					setTimeout(function () {
						_this.dropdownToRightAnimation = domElement.animate([
							{
								marginLeft: '-110%'
							}, {
								marginLeft: 0
							}
						], {
							duration: 200,
							easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
							fill: 'both'
						});
						setTimeout(function () {
							_this.dropdownToRightAnimation.onfinish = function () {
								if (this.hide) {
									_this.dropdownToTopAnimation.reverse();
								}
							};
							_this.dropdownToTopAnimation.onfinish = function () {
								if (this.show) {
									_this.dropdownToRightAnimation.reverse();
								}
							}
							_this.dropdownToTopAnimation.show = true;
							_this.dropdownToTopAnimation.hide = false;
						}, 200);
					}, 300);
				}
			} else {
				if (this.dropdownToTopAnimation) {
					this.dropdownToRightAnimation.hide = true;
					this.dropdownToTopAnimation.show = false;
					this.dropdownToRightAnimation.reverse();
				}
				else {
					this.dropdownToRightAnimation = domElement.animate([
						{
							marginLeft: 0
						}, {
							marginLeft: '-110%'
						}
					], {
						duration: 200,
						easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
						fill: 'both'
					});
					setTimeout(function () {
						_this.dropdownToTopAnimation = domElement.animate([
							{
								height: originalHeight
							}, {
								height: 0
							}
						], {
							duration: 300,
							easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
							fill: 'both'
						});
						setTimeout(function () {
							_this.dropdownToTopAnimation.hide = true;
							_this.dropdownToTopAnimation.show = false;
							_this.dropdownToTopAnimation.onfinish = function () {
								if (this.show) {
									_this.dropdownToRightAnimation.reverse();
								}
							}
							_this.dropdownToRightAnimation.onfinish = function () {
								if (this.hide) {
									_this.dropdownToTopAnimation.reverse();
								}
							};
						}, 300);
					}, 200);
				}
			}
			_this.showTriggers = show;
		}
	},

	/*
	 * Triggered when the scrollbars get updated (hidden or showed) and adapts the 
	 * icons' positions
	 * @param {boolean} Whether - the vertical scrollbar is now visible
	 */
	scrollbarsUpdate: function (vertical) {
		if (vertical !== this.verticalVisible) {
			if (vertical) {
				this.buttonsContainer.style.right = '29px';
			} else {
				this.buttonsContainer.style.right = '11px';
			}
			this.verticalVisible = !this.verticalVisible;
		}
	},

	/*
	 * Reloads the editor completely (to apply new settings)
	 */
	reloadEditor: function (disable) {
		$(this.editor.display.wrapper).remove();
		this.$.editorPlaceholder.style.display = 'flex';
		this.$.editorPlaceholder.style.opacity = 1;
		this.$.editorPlaceholder.style.position = 'absolute';

		this.newSettings.value.stylesheet = [];
		var lines = this.editor.doc.lineCount();
		for (var i = 0; i < lines; i++) {
			this.newSettings.value.stylesheet.push(this.editor.doc.getLine(i));
		}
		this.newSettings.value.stylesheet = this.newSettings.value.stylesheet.join('\n');
		this.editor = null;

		if (this.fullscreen) {
			this.loadEditor(window.doc.fullscreenEditorHorizontal, this.newSettings.value.stylesheet, disable);
		}
		else {
			this.loadEditor(this.$.editorCont, this.newSettings.value.stylesheet, disable);
		}
	},

	/*
	 * Fills the this.editorOptions element with the elements it should contain (the options for the editor)
	 */
	fillEditorOptions: function () {
		var settingsContainer = $('<div id="settingsContainer"></div>').appendTo(this.editorOptions);
		$('<div id="editorSettingsTxt">Editor Settings</div>').appendTo(settingsContainer);

		//The settings for the theme
		var theme = $('<div id="editorThemeSettingCont">' +
			'<div id="editorThemeSettingTxt">' +
			'Theme: ' +
			'</div>' +
			'<div id="editorThemeSettingChoicesCont">' +
			'</div>' +
			'</div>' +
			'<br>').appendTo(settingsContainer);

		//The white theme option
		$('<div id="editorThemeSettingWhite" class="editorThemeSetting' + (window.options.settings.editor.theme === 'white' ? ' currentTheme' : '') + '"></div>')
			.click(function () {
				var themes = this.parentNode.children;
				themes[0].classList.add('currentTheme');
				themes[1].classList.remove('currentTheme');
				window.options.settings.editor.theme = 'white';
				window.options.upload();
			}).appendTo(theme.find('#editorThemeSettingChoicesCont'));

		//The dark theme option
		$('<div id="editorThemeSettingDark" class="editorThemeSetting' + (window.options.settings.editor.theme === 'dark' ? ' currentTheme' : '') + '"></div>')
			.click(function () {
				var themes = this.parentNode.children;
				themes[0].classList.remove('currentTheme');
				themes[1].classList.add('currentTheme');
				window.options.settings.editor.theme = 'dark';
				window.options.upload();
			}).appendTo(theme.find('#editorThemeSettingChoicesCont'));

		//The font size
		var fontSize = $('<div id="editorThemeFontSize">' +
			'Editor zoom percentage:' +
			'</div>').appendTo(settingsContainer);

		$('<paper-input type="number" id="editorThemeFontSizeInput" no-label-float value="' + window.options.settings.editor.zoom + '"></paper-input>').on('keypress change', function () {
			var _this = this;
			setTimeout(function () {
				window.options.settings.editor.zoom = _this.value;
			}, 0);
		}).appendTo(fontSize);

		//The option to use tabs or spaces
		var tabsOrSpaces = $('<div id="editorTabsOrSpacesSettingCont">' +
			'<div id="editorTabsOrSpacesCheckbox">' +
			'</div>' +
			'<div id="editorTabsOrSpacesTxt">' +
			'Use tabs instead of spaces' +
			'</div>' +
			'</div>' +
			'<br>').appendTo(settingsContainer);

		//The main checkbox for the tabs or spaces option
		$('<paper-checkbox ' + (window.options.settings.editor.useTabs ? 'checked' : '') + '></paper-checkbox>').click(function () {
			window.options.settings.editor.useTabs = !window.options.settings.editor.useTabs;
			window.options.upload();
		}).appendTo(tabsOrSpaces.find('#editorTabsOrSpacesCheckbox'));

		//The option for the size of tabs
		var tabSize = $('<div id="editorTabSizeSettingCont">' +
			'<div id="editorTabSizeInput">' +
			'<paper-input-container>' +
			'<label>Tab size</label>' +
			'<input min="1" is="iron-input" type="number" value="' + window.options.settings.editor.tabSize + '"/>' +
			'</paper-input-container>' +
			'</div>' +
			'</div>' +
			'<br>').appendTo(settingsContainer);

		//The main input for the size of tabs option
		tabSize.find('input').change(function () {
			var input = $(this);
			setTimeout(function () {
				window.options.settings.editor.tabSize = input.val();
				window.options.upload();
			}, 0);
		});

		//The option to do or do not use line numbers
		var lineNumbers = $('<div id="editorUseLineNumbersSettingCont">' +
			'<div id="editorUseLineNumbersCheckbox">' +
			'</div>' +
			'<div id="editorUseLineNumbersTxt">' +
			'Use line numbers' +
			'</div>' +
			'</div><br>').appendTo(settingsContainer);

		//The main checkbox for the line numbers option
		$('<paper-checkbox ' + (window.options.settings.editor.lineNumbers ? 'checked' : '') + '></paper-checkbox>').click(function () {
			window.options.settings.editor.lineNumbers = !window.options.settings.editor.lineNumbers;
			window.options.upload();
		}).appendTo(lineNumbers.find('#editorUseLineNumbersCheckbox'));
	},

	/*
	 * Triggered when the codeMirror editor has been loaded, fills it with the options and fullscreen element
	 */
	cmLoaded: function (element) {
		var _this = this;
		this.editor = element;
		element.display.wrapper.classList.add('script-edit-codeMirror');
		var $buttonShadow = $('<paper-material id="buttonShadow" elevation="1"></paper-material>').insertBefore($(element.display.sizer).children().first());
		this.buttonsContainer = $('<div id="buttonsContainer"></div>').appendTo($buttonShadow)[0];
		var bubbleCont = $('<div id="bubbleCont"></div>').insertBefore($buttonShadow);
		//The bubble on settings open
		var $shadow = this.settingsShadow = $('<paper-material elevation="5" id="settingsShadow"></paper-material>').appendTo(bubbleCont);
		var $editorOptionsContainer = $('<div id="editorOptionsContainer"></div>').appendTo($shadow);
		this.editorOptions = $('<paper-material id="editorOptions" elevation="5"></paper-material>').appendTo($editorOptionsContainer);
		this.fillEditorOptions();
		this.fullscreenEl = $('<div id="editorFullScreen"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 48 48"><path d="M14 28h-4v10h10v-4h-6v-6zm-4-8h4v-6h6v-4H10v10zm24 14h-6v4h10V28h-4v6zm-6-24v4h6v6h4V10H28z"/></svg></div>').appendTo(this.buttonsContainer).click(function () {
			_this.toggleFullScreen.apply(_this);
		})[0];
		this.settingsEl = $('<div id="editorSettings"><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 48 48"><path d="M38.86 25.95c.08-.64.14-1.29.14-1.95s-.06-1.31-.14-1.95l4.23-3.31c.38-.3.49-.84.24-1.28l-4-6.93c-.25-.43-.77-.61-1.22-.43l-4.98 2.01c-1.03-.79-2.16-1.46-3.38-1.97L29 4.84c-.09-.47-.5-.84-1-.84h-8c-.5 0-.91.37-.99.84l-.75 5.3c-1.22.51-2.35 1.17-3.38 1.97L9.9 10.1c-.45-.17-.97 0-1.22.43l-4 6.93c-.25.43-.14.97.24 1.28l4.22 3.31C9.06 22.69 9 23.34 9 24s.06 1.31.14 1.95l-4.22 3.31c-.38.3-.49.84-.24 1.28l4 6.93c.25.43.77.61 1.22.43l4.98-2.01c1.03.79 2.16 1.46 3.38 1.97l.75 5.3c.08.47.49.84.99.84h8c.5 0 .91-.37.99-.84l.75-5.3c1.22-.51 2.35-1.17 3.38-1.97l4.98 2.01c.45.17.97 0 1.22-.43l4-6.93c.25-.43.14-.97-.24-1.28l-4.22-3.31zM24 31c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg></div>').appendTo(this.buttonsContainer).click(function () {
			_this.toggleOptions.apply(_this);
		})[0];
		if (element.getOption('readOnly') === 'nocursor') {
			element.display.wrapper.style.backgroundColor = 'rgb(158, 158, 158)';
		}
		if (this.fullscreen) {
			element.display.wrapper.style.height = 'auto';
			this.$.editorPlaceholder.style.display = 'none';
			$buttonShadow[0].style.right = '-1px';
			$buttonShadow[0].style.position = 'absolute';
			this.fullscreenEl.children[0].innerHTML = '<path d="M10 32h6v6h4V28H10v4zm6-16h-6v4h10V10h-4v6zm12 22h4v-6h6v-4H28v10zm4-22v-6h-4v10h10v-4h-6z"/>';
		}
		else {
			this.$.editorPlaceholder.style.height = this.editorHeight + 'px';
			this.$.editorPlaceholder.style.width = this.editorWidth + 'px';
			this.$.editorPlaceholder.style.position = 'absolute';
			if (this.editorPlaceHolderAnimation) {
				this.editorPlaceHolderAnimation.play();
			}
			else {
				this.editorPlaceHolderAnimation = this.$.editorPlaceholder.animate([
					{
						opacity: 1
					}, {
						opacity: 0
					}
				], {
					duration: 300,
					easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
				});
				this.editorPlaceHolderAnimation.onfinish = function () {
					this.effect.target.style.display = 'none';
				}
			}
		}
	},

	/*
	 * Loads the codeMirror editor
	 */
	loadEditor: function (container, content, disable) {
		var placeHolder = $(this.$.editorPlaceholder);
		this.editorHeight = placeHolder.height();
		this.editorWidth = placeHolder.width();
		this.editor = new window.CodeMirror(container, {
			lineNumbers: window.options.settings.editor.lineNumbers,
			mode: 'css',
			value: content || this.item.value.stylesheet,
			scrollbarStyle: 'simple',
			lineWrapping: true,
			readOnly: (disable ? 'nocursor' : false),
			theme: (window.options.settings.editor.theme === 'dark' ? 'dark' : 'default'),
			indentUnit: window.options.settings.editor.tabSize,
			indentWithTabs: window.options.settings.editor.useTabs,
			messageStylesheetEdit: true,
			extraKeys: { 'Ctrl-Space': 'autocomplete' },
			gutters: ['CodeMirror-lint-markers'],
			lint: window.CodeMirror.lint.css
		});
	},

	init: function () {
		var _this = this;
		document.body.classList.remove('editingScript');
		document.body.classList.add('editingStylesheet');
		this.newSettings = $.extend(true, {}, this.item);
		window.stylesheetEdit = this;
		this.$.editorPlaceholder.style.display = 'flex';
		this.$.editorPlaceholder.style.opacity = 1;
		this.$.executionTriggersContainer.style.display = (this.showTriggers = (this.item.value.launchMode === 2 || this.item.launchMode === '2') ? 'block' : 'none');
		this.$.dropdownMenu._addListener(this.selectorStateChange, this);
		if (this.editor) {
			this.editor.display.wrapper.remove();
			this.editor = null;
		}
		window.externalEditor.init();
		chrome.storage.local.set({
			editing: {
				val: this.item.value.stylesheet,
				crmPath: this.item.path
			}
		});
		this.savingInterval = window.setInterval(function() {
			if (_this.active) {
				//Save
				var val;
				try {
					val = _this.editor.getValue();
					chrome.storage.local.set({
						editing: {
							val: val,
							crmPath: _this.item.path
						}
					});
				} catch (e) { }
			} else {
				//Stop this interval
				chrome.storage.local.set({
					editing: false
				});
				window.clearInterval(_this.savingInterval);
			}
		}, 5000);
		this.active = true;
		setTimeout(function () {
			_this.loadEditor(_this.$.editorCont);
		}, 1250);
	}
});
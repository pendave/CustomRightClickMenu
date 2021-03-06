/// <reference path="../../elements.d.ts" />

const paperArrayInputProperties: {
	values: Array<any>;
	max: number;
	title: string;
	type: CRMOptionArray['items'];
	subtext: string;
} = {
	values: {
		type: Array,
		notify: true
	},
	max: {
		type: Number,
		value: -1
	},
	title: {
		type: String,
		value: '',
		notify: true
	},
	type: {
		type: String,
		value: 'string'
	},
	subtext: {
		type: String,
		value: ''
	}
} as any;

type PaperArrayInput = PolymerElement<'paper-array-input',
	typeof PAI & typeof paperArrayInputProperties>;

class PAI {
	static is: string = 'paper-array-input';

	static properties = paperArrayInputProperties;

	static _maxReachedTimeout: number = -1;

	static _hasItems<T extends Array<S>, S>(arr: T): boolean {
		return arr && arr.length > 0;
	}

	static _stringIsSet(str: string): boolean {
		return str && str !== '';
	}

	static saveSettings(this: PaperArrayInput) {
		this.set('values', Array.prototype.slice.apply(this.querySelectorAll('.arrayInputLine'))
			.map((element: HTMLElement) => {
				return element.querySelector('paper-input').value;
			}));
	}

	static addLine(this: PaperArrayInput) {
		this.saveSettings();

		if (this.max !== -1 && (this.values && this.values.length >= this.max)) {
			this.$.maxElementsReachedMessage.classList.add('visible');
			let timer = window.setTimeout(() => {
				if (this._maxReachedTimeout === timer) {
					this.$.maxElementsReachedMessage.classList.remove('visible');
				}
			}, 5000);
			this._maxReachedTimeout = timer;
			return;
		}
		if (!this.values) {
			this.set('values', []);
		}
		this.push('values', '');
	}

	static clearLine(this: PaperArrayInput, e: PolymerClickEvent) {
		this.async(() => {
			this.saveSettings();
			const iconButton = window.app.findElementWithTagname(e.path, 'paper-icon-button');
			this.splice('values', Array.prototype.slice.apply(this.querySelectorAll('.arrayInputLine'))
				.indexOf(iconButton.parentElement.parentElement), 1);
		}, 50);
	}

	static ready(this: PaperArrayInput) {
		this.values = this.values || [];
		if (this.max === undefined) {
			this.max = -1;
		}
	}
}

Polymer(PAI);
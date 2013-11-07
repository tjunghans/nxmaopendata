(function (window) {

	'use strict';

	function Minesweeper(rows, cols, mines) {
		this.init(rows, cols, mines);
	}

	Minesweeper.prototype = {
		constructor : Minesweeper,
		init : function (rows, cols, mines) {
			this.rows = rows;
			this.cols = cols;
			this.mines = mines;

			this.totalFields = this.rows * this.cols;
			this.fieldsToUncover = this.totalFields - this.mines;

			/**
			 * Field matrix, containing a 2D-array
			 * @type {Array}
			 */
			this.mineLand = [];

			/**
			 * Holds references to all fields with mines
			 * @type {Array<Field>}
			 */
			this.mineFields = [];

			this.createFields();
			this._generateMineCoords();


		},



		getField : function (x, y) {
			if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
				return this.mineLand[y][x];
			} else {
				return null;
			}

		},

		/**
		 * 0 based
		 * @param maxNumber
		 * @returns {number}
		 */
		getRandom : function (maxNumber) {
			return Math.floor(Math.random() * maxNumber);
		},

		_generateMineCoords : function () {

			var mineCoords;

			for (var n = 0; n < this.mines; n++) {

				mineCoords = this._getNextMineCoord();

				var field = this.getField(mineCoords.x, mineCoords.y);

				field.placeMine();

				this.mineFields.push(field);

				console.info(this.getField(mineCoords.x, mineCoords.y));
			}

			console.dir(this.mineFields);


		},

		_getEmptyFieldsByColumn : function (x) {
			var column = [];

			for (var y = 0; y < this.rows; y++) {
				if (this.getField(x, y).isMine() === false) {
					column.push(this.getField(x, y));
				}
			}

			return column;
		},

		/**
		 *
		 * @returns {Coords}
		 * @private
		 */
		_getNextMineCoord : function () {

			var candidates = [];

			for (var x = 0; x < this.cols; x++) {
				var rows = this._getEmptyFieldsByColumn(x);

				if (rows.length > 0) {
					candidates.push({
						x : x,
						rows : rows
					});
				}
			}

			var candidate = candidates[this.getRandom(candidates.length)];
			return new Coords(
				candidate.x,
				candidate.rows[this.getRandom(candidate.rows.length)].coords.y
			);
		},

		getMineFields : function () {
			return this.mineFields;
		},

		createFields : function () {
			for (var m = 0; m < this.rows; m++) {
				var fieldCol = [];
				for (var n = 0; n < this.cols; n++) {
					fieldCol.push(new Field(new Coords(n, m)));
				}
				this.mineLand.push(fieldCol);
			}
		},

		getSurroundingFields : function (x, y) {

			var possibleNeighbourCoords = [
				new Coords(x - 1, y),
				new Coords(x + 1, y),
				new Coords(x - 1, y - 1),
				new Coords(x + 1, y - 1),
				new Coords(x - 1, y + 1),
				new Coords(x + 1, y + 1),
				new Coords(x, y + 1),
				new Coords(x, y - 1)
			];

			var neighbours = [];

			for (var i = 0, ii = possibleNeighbourCoords.length; i < ii; i++) {
				var coords = possibleNeighbourCoords[i];
				var possibleNeighbour = this.getField(coords.x, coords.y);

				if (possibleNeighbour !== null) {
					neighbours.push(possibleNeighbour);
				}
			}

			return neighbours;

		},

		getNumberOfSurroundingMines : function (x, y) {
			var mineCounter = 0,
				fields = this.getSurroundingFields(x, y);

			for (var i = 0, ii = fields.length; i < ii; i++) {
				if (fields[i].isMine()) {
					mineCounter++;
				}
			}

			return mineCounter;
		},


		/**
		 * Returns all surrounding empty fields including their surrounding empty fields
		 * @param x
		 * @param y
		 */
		getSurroundingSafeFields : function (x, y) {
			var minesweeper = this;

			var safeFields = [];

			function findSafeNeighbours(x, y) {
				var surroundingMines = minesweeper.getNumberOfSurroundingMines(x, y);

				if (surroundingMines === 0) {

					var neighbours = minesweeper.getSurroundingFields(x, y);

					for (var i = 0, ii = neighbours.length; i < ii; i++) {
						if (neighbours[i].isUncovered()) {
							continue;
						}
						safeFields.push(neighbours[i]);
						neighbours[i].walkOver();
						findSafeNeighbours(neighbours[i].coords.x, neighbours[i].coords.y);
					}

				}
			}

			findSafeNeighbours(x, y);

			return safeFields;
		},

		getUncoveredFields : function () {
			var walkedOverFields = [];

			for (var y = 0; y < this.rows; y++) {
				for (var x = 0; x < this.cols; x++) {
					var field = this.getField(x, y);

					if (field.isUncovered()) {
						walkedOverFields.push(field);
					}
				}
			}

			return walkedOverFields;

		},

		isMine : function(x, y) {
			return this.getField(x, y).isMine();
		},

		isGameWon : function () {
			return this.getUncoveredFields().length === this.fieldsToUncover;
		}
	};

	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 * @constructor
	 */
	function Coords(x, y) {
		this.x = x;
		this.y = y;
	}

	Coords.prototype = {
		toString : function () {
			return this.x + ',' + this.y;
		}
	};

	/**
	 *
	 * @param {Coords} coords
	 * @constructor
	 */
	function Field(coords) {
		this.init(coords);
	}

	Field.prototype = {
		constructor : Field,
		init : function (coords) {
			this.coords = coords;
			this.mine = false;
			this.walkedOver = false;
			this.flagged = false;
		},
		/**
		 * Setter
		 * @returns {boolean}
		 */
		placeMine : function() {
			this.mine = true;
			return this.mine;
		},

		/**
		 *
		 * @returns {boolean}
		 */
		isMine : function () {
			return this.mine;
		},

		/**
		 *
		 * @returns {boolean}
		 */
		isUncovered : function () {
			return this.walkedOver;
		},

		/**
		 * Marks a field as "walked over" or clicked
		 * @returns void
		 */
		walkOver : function () {
			this.walkedOver = true;
		},

		/**
		 *
		 * @returns {boolean}
		 */
		isFlagged : function () {
			return this.flagged;
		},

		/**
		 * Toggles flag value
		 *
		 * @returns {boolean}
		 */
		toggleFlag : function () {
			return this.flagged = !this.flagged;
		}
	};

	window.tj = {};
	window.tj.Minesweeper = Minesweeper;
	window.tj.Field = Field;
	window.tj.Coords = Coords;
}(window));
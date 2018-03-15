/*!
 * Packery v2.1.1
 * Gapless, draggable grid layouts
 *
 * Licensed GPLv3 for open source use
 * or Packery Commercial License for commercial use
 *
 * http://packery.metafizzy.co
 * Copyright 2016 Metafizzy
 */

'use strict'

const getSize = require('./get-size')
const Outlayer = require('./outlayer')
const Rect = require('./rect')
const Packer = require('./packer')
const Item = require('./item')

// ----- Rect ----- //

// allow for pixel rounding errors IE8-IE11 & Firefox; #227
Rect.prototype.canFit = function(rect) {
	return this.width >= rect.width - 1 && this.height >= rect.height - 1
}

// -------------------------- Packery -------------------------- //

// create an Outlayer layout class
var Packery = Outlayer.create('packery')
Packery.Item = Item

var proto = Packery.prototype

proto._create = function() {
	// call super
	Outlayer.prototype._create.call(this)

	// initial properties
	this.packer = new Packer()
	// packer for drop targets
	this.shiftPacker = new Packer()
	this.isEnabled = true
}

// ----- init & layout ----- //

/**
 * logic before any new layout
 */
proto._resetLayout = function() {
	this.getSize()

	this._getMeasurements()

	// reset packer
	var width = this.size.innerWidth + this.gutter
	var height = Infinity
	var sortDirection = 'downwardLeftToRight'

	this.packer.width = this.shiftPacker.width = width
	this.packer.height = this.shiftPacker.height = height
	this.packer.sortDirection = this.shiftPacker.sortDirection = sortDirection

	this.packer.reset()

	// layout
	this.maxY = 0
	this.maxX = 0
}

/**
 * update columnWidth, rowHeight, & gutter
 * @private
 */
proto._getMeasurements = function() {
	this._getMeasurement('columnWidth', 'width')
	this._getMeasurement('rowHeight', 'height')
	this._getMeasurement('gutter', 'width')
}

proto._getItemLayoutPosition = function(item) {
	this._setRectSize(item.element, item.rect)

	this.packer.pack(item.rect)

	this._setMaxXY(item.rect)
	return item.rect
}

proto.shiftLayout = function() {
	this.isShifting = true
	this.layout()
	delete this.isShifting
}

proto._getPackMethod = function() {
	return 'columnPack'
}

/**
 * set max X and Y value, for size of container
 * @param {Packery.Rect} rect
 * @private
 */
proto._setMaxXY = function(rect) {
	this.maxX = Math.max(rect.x + rect.width, this.maxX)
	this.maxY = Math.max(rect.y + rect.height, this.maxY)
}

/**
 * set the width and height of a rect, applying columnWidth and rowHeight
 * @param {Element} elem
 * @param {Packery.Rect} rect
 */
proto._setRectSize = function(elem, rect) {
	var size = getSize(elem)
	var w = size.outerWidth
	var h = size.outerHeight
	// size for columnWidth and rowHeight, if available
	// only check if size is non-zero, #177
	if (w || h) {
		w = this._applyGridGutter(w, this.columnWidth)
		h = this._applyGridGutter(h, this.rowHeight)
	}
	// rect must fit in packer
	rect.width = Math.min(w, this.packer.width)
	rect.height = Math.min(h, this.packer.height)
}

/**
 * fits item to columnWidth/rowHeight and adds gutter
 * @param {Number} measurement - item width or height
 * @param {Number} gridSize - columnWidth or rowHeight
 * @returns measurement
 */
proto._applyGridGutter = function(measurement, gridSize) {
	// just add gutter if no gridSize
	if (!gridSize) {
		return measurement + this.gutter
	}
	gridSize += this.gutter
	// fit item to columnWidth/rowHeight
	var remainder = measurement % gridSize
	var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil'
	measurement = Math[mathMethod](measurement / gridSize) * gridSize
	return measurement
}

proto._getContainerSize = function() {
	return {
		height: this.maxY - this.gutter,
	}
}

// -------------------------- methods -------------------------- //

function verticalSorter(a, b) {
	return a.position.y - b.position.y || a.position.x - b.position.x
}

proto.sortItemsByPosition = function() {
	var sorter = verticalSorter
	this.items.sort(sorter)
}

// -------------------------- resize -------------------------- //

// debounced, layout on resize
proto.resize = function() {
	// don't trigger if size did not change
	// or if resize was unbound. See #285, outlayer#9
	if (!this.isResizeBound || !this.needsResizeLayout()) {
		return
	}

	this.layout()
}

/**
 * check if layout is needed post layout
 * @returns Boolean
 */
proto.needsResizeLayout = function() {
	var size = getSize(this.element)
	var innerSize = 'innerWidth'
	return size[innerSize] != this.size[innerSize]
}

// ----- destroy ----- //

var _destroy = proto.destroy
proto.destroy = function() {
	_destroy.apply(this, arguments)
	// disable flag; prevent drag events from triggering. #72
	this.isEnabled = false
}

// -----  ----- //

Packery.Rect = Rect
Packery.Packer = Packer

module.exports = Packery

/**
 * Packery Item Element
 **/

'use strict'
import Outlayer from './outlayer'
import Rect from './rect'

// -------------------------- Item -------------------------- //

var docElemStyle = document.documentElement.style

var transformProperty =
	typeof docElemStyle.transform == 'string' ? 'transform' : 'WebkitTransform'

// sub-class Item
var Item = function PackeryItem() {
	Outlayer.Item.apply(this, arguments)
}
export default Item

var proto = (Item.prototype = Object.create(Outlayer.Item.prototype))

var __create = proto._create
proto._create = function() {
	// call default _create logic
	__create.call(this)
	this.rect = new Rect()
}

var _moveTo = proto.moveTo
proto.moveTo = function(x, y) {
	// don't shift 1px while dragging
	var dx = Math.abs(this.position.x - x)
	var dy = Math.abs(this.position.y - y)

	var canHackGoTo =
		this.layout.dragItemCount &&
		!this.isPlacing &&
		!this.isTransitioning &&
		dx < 1 &&
		dy < 1
	if (canHackGoTo) {
		this.goTo(x, y)
		return
	}
	_moveTo.apply(this, arguments)
}

// -------------------------- placing -------------------------- //

proto.enablePlacing = function() {
	this.removeTransitionStyles()
	// remove transform property from transition
	if (this.isTransitioning && transformProperty) {
		this.element.style[transformProperty] = 'none'
	}
	this.isTransitioning = false
	this.getSize()
	this.layout._setRectSize(this.element, this.rect)
	this.isPlacing = true
}

proto.disablePlacing = function() {
	this.isPlacing = false
}

// -----  ----- //

// remove element from DOM
proto.removeElem = function() {
	var parent = this.element.parentNode
	if (parent) {
		parent.removeChild(this.element)
	}
	// add space back to packer
	this.layout.packer.addSpace(this.rect)
	this.emitEvent('remove', [this])
}

// ----- dropPlaceholder ----- //

proto.showDropPlaceholder = function() {
	var dropPlaceholder = this.dropPlaceholder
	if (!dropPlaceholder) {
		// create dropPlaceholder
		dropPlaceholder = this.dropPlaceholder = document.createElement('div')
		dropPlaceholder.className = 'packery-drop-placeholder'
		dropPlaceholder.style.position = 'absolute'
	}

	dropPlaceholder.style.width = this.size.width + 'px'
	dropPlaceholder.style.height = this.size.height + 'px'
	this.positionDropPlaceholder()
	this.layout.element.appendChild(dropPlaceholder)
}

proto.positionDropPlaceholder = function() {
	this.dropPlaceholder.style[transformProperty] =
		'translate(' + this.rect.x + 'px, ' + this.rect.y + 'px)'
}

proto.hideDropPlaceholder = function() {
	// only remove once, #333
	var parent = this.dropPlaceholder.parentNode
	if (parent) {
		parent.removeChild(this.dropPlaceholder)
	}
}

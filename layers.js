// jshint curly: true
/* global ig */
ig.module(
	'plugins.layers'
).requires(
	'impact.game',
	'impact.background-map',
	'impact.entity'
).defines(function(){ 'use strict';

ig.Game.inject({

	// Default group of layers
	layerOrder: [],

	// All renderable layers
	layers: {},

	init: function(){
		// Setup the necessary order
		this.createLayer('backgroundMaps', {
			clearOnLoad: true,
			mapLayer: true
		});

		this.createLayer('entities', {
			clearOnLoad: true,
			entityLayer: true,
			autoSort : this.autoSort,
			sortBy   : this.sortBy,
			_doSortEntities: false
		});

		this.createLayer('foregroundMaps', {
			clearOnLoad: true,
			mapLayer: true
		});
	},

	setLayerProperties: function(layerName, properties){
		this._layerProperties.push([layerName, properties]);
		return this;
	},

	setLayerSort: function(order){
		this._layerOrder = (order && order.length) ? order : [];
		return this;
	},

	// Create's a layer
	createLayer: function(name, properties, passive){
		var layer = this.layers[name] = ig.merge(this.layers[name] || {}, properties);
		if (!layer.items) {
			layer.items = [];
		}

		// Enable backwards support of the `entities` layer
		if (name === 'entities') {
			this.entities = layer.items;
		}

		// If passive, we don't add the newly created layer
		// to layerRenderOrder
		if (passive) {
			return this;
		}
		this.layerOrder.push(name);
		return this;
	},

	// Layer removal queue
	_layerProperties : [],
	_layersToRemove  : [],
	_itemsToRemove   : [],

	// To remove the possibility of ever experiencing a race condition,
	// every call to removeLayer is deferred
	removeLayer: function(name){
		var index = this._layersToRemove.indexOf(name);
		// Only add the layer to the array if it hasn't been added already
		if (index === -1) {
			this._layersToRemove.push(name);
		}
		return this;
	},

	// Removes all items on a given layer, safely
	clearLayer: function(layerName){
		this._itemsToRemove = this._itemsToRemove.concat(this.layers[layerName].items);
		return this;
	},

	// Add an item to a specific layer
	addItem: function(item, layerName){
		var layer;
		layerName = layerName || item._layer;
		// Throw a descriptive error if the layer doesn't exist
		layer = this.layers[layerName];
		if (!layer) {
			throw new Error('Attempting to add to a layer that doesn\'t exist: ' + layerName);
		}

		// Always hold a reference to the item's layer, for easier removal
		item._layer = layerName;
		layer.items.push(item);
		return this;
	},

	// To remove the possibility of ever experiencing a race condition,
	// every call to removeItem is deferred
	removeItem: function(item) {
		if (!item || !item._layer) {
			throw new Error('Layers: Cannot remove an item that doesn\'t exist or has now ._layer property');
		}
		this._itemsToRemove = this._itemsToRemove.concat(item);
		return this;
	},

	sortEntitiesDeferred: function(layer) {
		layer = layer || 'entities';
		this.layers[layer]._doSortEntities = true;
	},

	sortEntities: function(layer) {
		layer = this.layers[layer || 'entities'];
		if (!layer) {
			return this;
		}
		layer.items.sort(layer.sortBy);
		return this;
	},

	updateEntities: function(layerName) {
		var entities = this.layers[layerName || 'entities'].items,
			ent, i;
		for (i = 0; i < entities.length; i++ ) {
			ent = entities[i];
			if(!ent._killed) {
				ent.update();
			}
		}
		return this;
	},

	checkEntities: function(entities) {
		var hash = {}, layer, len, e, entity, checked,
			xmin, ymin, xmax, ymax, x, y, cell, c;

		// Get the array of entities based on the passed in argument
		// or just default to the entities layer
		layer = this.layers[entities || 'entities'];
		if (!layer || !layer.entityLayer) {
			return;
		}

		entities = layer.items;
		len = entities.length;
		// Insert all entities into a spatial hash and check them against any
		// other entity that already resides in the same cell. Entities that are
		// bigger than a single cell, are inserted into each one they intersect
		// with.

		// A list of entities, which the current one was already checked with,
		// is maintained for each entity.
		for (e = 0; e < len; e++) {
			entity = entities[e];

			// Skip entities that don't check, don't get checked and don't collide
			if(
				entity.type === ig.Entity.TYPE.NONE &&
				entity.checkAgainst === ig.Entity.TYPE.NONE &&
				entity.collides === ig.Entity.COLLIDES.NEVER
			) {
				continue;
			}

			checked = {};
			xmin = Math.floor(entity.pos.x / this.cellSize);
			ymin = Math.floor(entity.pos.y / this.cellSize);
			xmax = Math.floor((entity.pos.x + entity.size.x) / this.cellSize) + 1;
			ymax = Math.floor((entity.pos.y + entity.size.y) / this.cellSize) + 1;

			for (x = xmin; x < xmax; x++) {
				for (y = ymin; y < ymax; y++) {
					// Current cell is empty - create it and insert!
					if (!hash[x]) {
						hash[x] = {};
						hash[x][y] = [entity];
					} else if(!hash[x][y]) {
						hash[x][y] = [entity];
					// Check against each entity in this cell, then insert
					} else {
						cell = hash[x][y];
						for (c = 0; c < cell.length; c++) {
							// Intersects and wasn't already checkd?
							if(entity.touches(cell[c]) && !checked[cell[c].id]) {
								checked[cell[c].id] = true;
								ig.Entity.checkPair(entity, cell[c]);
							}
						}
						cell.push(entity);
					}
				} // end for y size
			} // end for x size
		} // end for entities
	},

	getEntitiesByType: function(type, layer) {
		var entityClass = typeof(type) === 'string' ? ig.global[type] : type,
			a = [], i, ent, entities, elen;

		entities = this.layers[layer || 'entities'].items;
		elen = entities.length;

		for (i = 0; i < elen; i++) {
			ent = entities[i];
			if( ent instanceof entityClass && !ent._killed ) {
				a.push( ent );
			}
		}
		return a;
	},

	getMapByName: function(name) {
		var x, xx, items, layer;
		if(name === 'collision') {
			return this.collisionMap;
		}

		// Iterate through background layers to find the named one
		for (x = 0; x < this.layerOrder.length; x++) {
			layer = this.layers[this.layerOrder[x]];
			items = layer.items;

			if (!layer.mapLayer) {
				continue;
			}

			for (xx = 0; xx < items.length; xx++) {
				if(items[xx].name === name) {
					return items[xx];
				}
			}
		}

		return null;
	},

	update: function(){
		// Variables for layer updates
		var layerName, layer, x, xx, items, item,
			tileset, anims;

		// Set any deferred layer properties
		while (this._layerProperties.length) {
			layer = this._layerProperties.shift();
			ig.merge(this.layers[layer[0]], layer[1]);
		}

		// Remove all queued items
		while (this._itemsToRemove.length) {
			item  = this._itemsToRemove.shift();
			items = this.layers[item._layer].items;
			x = items.indexOf(item);
			if (item._cleanUp) {
				item._cleanUp();
			}
			if (x < 0) {
				continue;
			}
			items.splice(x, 1);
		}

		// Remove all deferred layers
		while (this._layersToRemove.length) {
			layerName = this._layersToRemove.shift();
			layer = this.layers[layerName];
			if (!layer) {
				continue;
			}
			if (layer.clean) {
				this._itemsToRemove = this._itemsToRemove.concat(layer.items);
			}
			delete this.layers[layerName];
		}

		// Update new layer order
		if (this._layerOrder) {
			this.layerOrder = this._layerOrder;
			this._layerOrder = null;
		}

		// load new level
		if(this._levelToLoad) {
			this.loadLevel(this._levelToLoad);
			this._levelToLoad = null;
		}

		// Execute update and associated functions for all applicable layers
		for (x = 0; x < this.layerOrder.length; x++) {
			layerName = this.layerOrder[x];
			layer = this.layers[layerName];
			items = layer.items;

			if (layer.noUpdate || layer.mapLayer) {
				continue;
			}

			for (xx = 0; xx < items.length; xx++) {
				items[xx].update();
			}

			if (layer.entityLayer && (layer._doSortEntities || layer.autoSort)) {
				items.sort(layer.sortBy || this.sortBy);
				layer._doSortEntities = false;
			}

			if (layer.entityLayer) {
				this.checkEntities(layerName);
			}
		}

		// Remove all killed entities
		while (this._deferredKill.length) {
			item  = this._deferredKill.shift();
			items = this.layers[item._layer].items;
			x = items.indexOf(item);
			if (item._cleanUp) {
				item._cleanUp();
			}
			if (x < 0) {
				continue;
			}
			items.splice(x, 1);
		}

		// Update background animations
		for (tileset in this.backgroundAnims) {
			anims = this.backgroundAnims[tileset];
			for (x in anims) {
				anims[x].update();
			}
		}
	},

	draw: function(){
		// Variables for layer draws
		var layer, x, xx, items;

		if(this.clearColor) {
			ig.system.clear(this.clearColor);
		}

		// This is a bit of a circle jerk. Entities reference game._rscreen
		// instead of game.screen when drawing themselfs in order to be
		// "synchronized" to the rounded(?) screen position
		this._rscreen.x = ig.system.getDrawPos(this.screen.x) / ig.system.scale;
		this._rscreen.y = ig.system.getDrawPos(this.screen.y) / ig.system.scale;

		for (x = 0; x < this.layerOrder.length; x++) {
			layer = this.layers[this.layerOrder[x]];
			items = layer.items;
			if (layer.noDraw) {
				continue;
			}
			for (xx = 0; xx < items.length; xx++) {
				items[xx].draw();
			}
		}
	},

	spawnEntity: function(type, x, y, settings) {
		var EntityClass = typeof(type) === 'string' ? ig.global[type] : type, ent;

		if(!EntityClass) {
			throw new Error('Can\'t spawn entity of type: ' + type);
		}

		ent = new (EntityClass)(x, y, settings || {});

		// Push entity into appropriate layer
		this.addItem(ent);

		if(ent.name) {
			this.namedEntities[ent.name] = ent;
		}

		return ent;
	},


	loadLevel: function(data) {
		var len = this.layerOrder.length,
			i, ent, ld, newMap, ilen,
			layer, layerName, x, items;

		this.screen = {
			x: 0,
			y: 0
		};

		// Clear out existing stuff
		for (x = 0; x < len; x++) {
			layerName = this.layerOrder[x];
			layer = this.layers[layerName];
			// If the layer has been already somehow cleared...
			if (!layer) {
				continue;
			}
			if (layer.clearOnLoad) {
				layer.items = [];
				// Fix entities array compatibility
				if (layerName === 'entities') {
					this.entities = layer.items;
				}
			}
		}

		// Entities
		this.namedEntities = {};
		for (i = 0; i < data.entities.length; i++ ) {
			ent = data.entities[i];
			this.spawnEntity(ent.type, ent.x, ent.y, ent.settings);
		}

		// TODO: Make sortEntities sort all layers if no key provided
		this.sortEntities();

		// Map Layer
		this.collisionMap = ig.CollisionMap.staticNoCollision;
		for (i = 0; i < data.layer.length; i++ ) {
			ld = data.layer[i];
			if(ld.name === 'collision') {
				this.collisionMap = new ig.CollisionMap(ld.tilesize, ld.data );
			} else {
				newMap = new ig.BackgroundMap(ld.tilesize, ld.data, ld.tilesetName);
				newMap.anims = this.backgroundAnims[ld.tilesetName] || {};
				newMap.repeat = ld.repeat;
				newMap.distance = ld.distance;
				newMap.foreground = !!ld.foreground;
				newMap.preRender = !!ld.preRender;
				newMap.name = ld.name;

				// No layer provided, which means we guesstimate
				if (!newMap._layer && newMap.foreground) {
					newMap._layer = 'foregroundMaps';
				} else if (!newMap._layer) {
					newMap._layer = 'backgroundMaps';
				}

				this.addItem(newMap);
			}
		}

		for (x = 0; x < len; x++) {
			layerName = this.layerOrder[x];
			layer = this.layers[layerName];
			items = layer.items;
			ilen  = items.length;

			if (layer.entityLayer) {
				for (i = 0; i < ilen; i++) {
					items[i].ready();
				}
			}
		}
	},

	drawEntities: function(layerName) {
		var entities, elen, i;

		layerName = layerName || 'entities';
		entities = this.layers[layerName].items;

		for (i = 0; i < elen; i++) {
			entities[i].draw();
		}
	}

});

ig.Entity.inject({

	_layer: 'entities'

});

ig.BackgroundMap.inject({

	// I added .setScreenPos to the draw method to make the game-wide
	// drawing method much simpler
	draw: function(){
		this.setScreenPos(ig.game.screen.x, ig.game.screen.y);
		if (!this.tiles.loaded || !this.enabled) {
			return;
		}
		if (this.preRender) {
			this.drawPreRendered();
		} else {
			this.drawTiled();
		}
	}

});

});

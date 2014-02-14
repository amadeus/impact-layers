# Layers

Layers is an easy to use plugin for [ImpactJS](http://impactjs.com) that replaces the built in `update` and `draw` methods for `ig.Game` with a vastly superior API for handling various layers of `items` (including `entities`, `backgroundMaps`, and `foregroundMaps`.)  If you are already sold, then skip over to [Getting Started](#getting-started) now, otherwise read on for a more complete explanation.

Layers.js requires [ImactJS v1.23](http://impactjs.com).


## Why?

You may be asking, "Why should I even use this plugin?" A fair question, but the answer will first take a bit of an explanation.

Normally when you create an ImpactJS game you are going to require a dearth of extra functionality not immediately available.  Thankfully ImpactJS is pretty extensible and allows you easily extend any aspect of the framework to do your bidding.  While this is pretty awesome, one needs to also be careful with such power; as they say, with great power comes great responsibility.  It is easy to create overwhelming complexity in your ImpactJS application and therefore it's a good idea enforce certain patterns to keep everything sane.

Generally speaking, the way to add additional functionality is to extend the `update` and `draw` methods.  These two methods alone account nearly all of execution time in an ImpactJS application.  For each frame of the application (generally executed 60 times a second) the engine first fires `update`, then `draw`.

By default, the `update` method iterates through all backgrounds, entities and foregrounds (in that order) to update their states.  This is all immediately followed by `draw` which uses that state to draw the appropriate game state.

Out of the box, ImpactJS simply supports `backgroundMaps`, `entities`, and `foregroundMaps`, but what happens if, for example, you want to add a GUI that overlays on top the game? This is where the extendability in ImpactJS starts to get hairy.  Normally the way to do this would be to extend the ig.Game draw method to something like this:

```js
draw: function(){
	this.parent();       // First we draw the game state
	this.drawGUILayer(); // Now we draw the GUI, on top of everything else
}
```

This draw method would always ensure that the GUI is drawn on top of all other game elements.  Sure this is quick and dirty, and yes it works, however, what happens if we want to build a pause screen? We have to now add logic into `.drawGUILayer` to ensure it doesn't display when the game is paused. This can also apply to numerous situations, such as the level completion screen, or the opening menu, etc. All of a sudden you have this extra function call that is highly unnecessary in many contexts, and every time you build out a new part of your game that doesn't need the GUI, you have to ensure this method never gets called or returns immediately; the beginning of some good (bad) spaghetti code!

Enter Layers, the elegant way of handling all of this. As I stated earlier, Layers overwrites the based `update` and `draw` methods of `ig.Game` with a highly extendible API that allows you to draw any number of layers in any order you please. Read on into the [Getting Started](#getting-started) section to learn the new and improved way of doing things in Layers.


## Getting Started

Simply add layers.js to your impact plugins folder and set a requires for your game module (see the example main.js). Layers will simply inject itself on top of the existing ig.Game constructor, meaning you don't really have to do anything special to take advantage of it.

Layers creates two main variables on the game instance that you should be aware of - `.layerOrder` and `.layers`.

`.layerOrder` is an array of strings, it defines what layers are drawn and what order. By default it would look like this:

`['backgroundMaps', 'entities', 'foregroundMaps']`

`.layers` is an object/dictionary of all the available layers.

Note that `.layerOrder` does not need to contain ALL layers held in the `.layers` object. This gives you the great power to simply toggle layers on and off as needed without having to recreate them.

Generally speaking the way to use Layers is to first add layers using `.createLayer` method. Here's a quick example, from the included example application:

```js
init: function() {
	this.parent();

	this.createLayer('gui');

	this.addItem({
		_layer: 'gui',

		font: this.font,

		update: function(){
			this.x = ig.system.width  / 2;
			this.y = ig.system.height / 2;
		},

		draw: function(){
			this.font.draw(
				'Hello World!, I am a layer!',
				this.x,
				this.y,
				ig.Font.ALIGN.CENTER
			);
		}
	});
}
```

The first part of the `init` method we call `this.parent()` to ensure all default layers get created. Next we call the `.createLayer` method to create a new layer for gui stuff. As a result of this call, the gui layer gets added as the topmost layer in `.layerOrder`.

The second part is where we actually add an item to the `gui` layer to be drawn on the game canvas. Normally you would add an instance of something, such as an `entity` object or `background-map`, but for the sake of this explanation, we are keeping it as a simple object with the bare minimum requirements for a layer.

The first property of the item, `_layer` instructs the `.addItem` method which layer to add the item too. The `font` property is simply a reference for our `draw` method.

Next we have an `update` method that updates the `x` and `y` position for the `draw` method.

Lastly, the `draw` method is where we actually draw the font to the canvas.

Remember, `update` and `draw` are fired approximately 60 times a second, like the normal ImpactJS `update`/`draw` methods.

And voilà, we've created our first Layers game!


## Things to note

In order to use layers almost immediately in your application, simply remember the `this.parent()` call at the start of your game's `init` function. This will ensure all the default layers get created (`backgroundMaps`, `entities`, `foregroundMaps`.)  All existing methods that deal with entities or background maps have been updated to "just work" with this new API.


## ig.game Methods

### `createLayer`

The method used for creating new layers. By default, if you create a layer, it is added to the `layerOrder` array.

#### Example Usage

```js
this.createLayer(layerName [String], properties [Object, optional], passive [Boolean, optional]);
```

#### Arguments

`layerName`: This string is essentially the name or id of the layer. The layer object will get stored in the `.layers` object using this as the key. It must be a string.

`properties`: This object is optional, and can take a variety of properties defined in [Layer Properties](#layer-properties).

`passive`: This boolean is also optional. If set to true, the `layerName` will NOT automatically be added to `layerOrder` array (you would set this to true if you want to create a layer for later use.)


### `removeLayer`

Removes a specified layer from the `.layers` object. Deferred until next frame for safety. Please note that removeLayer does not modify `.layerOrder` if you remove a layer, be sure you also update `.layerOrder` using the method `.setLayerSort` below.

#### Example Usage

```js
this.removeLayer(layerName [String]);
```

#### Arguments

`layerName`: The name of the layer to be removed.


### `addItem`

This method is used to add items (and by items it can range from an entity or background-map instance, to your own custom objects) to a layer. The item must contain a `_layer` key with the value being a string of the layer to add the item too.  Also be sure that it has the appropriate `update` and/or `draw` methods as per the layer's options.
#### Example Usage

```js
this.addItem(item [Object/Class Instance], layerName [String, optional]);
```

#### Arguments

`item`: This is an object or class instance (such as an entity or background-map) to be added to a layer.

`layerName`: This allows you to specify the layer to add the item too. It overwrites the built in `_layer` property.


### `removeItem`

This is the opposite of `addItem`. It removes the passed in item from the layer it is on.

#### Example Usage

```js
this.removeItem(item [Object/Class Instance]);
```

#### Arguments

`item`: This is an object or class instance (such as an entity or background-map) to be removed.


### `setLayerProperties`

This sets the properties of a given layer, but it is deferred until the next frame, to be safe.

#### Example Usage

```js
this.setLayerProperties(layerName [String], properties [Object]);
```

#### Arguments

`layerName`: The layer whose properties to edit.

`properties`: The properties to merge into the layer.


### `setLayerSort`

Replaces `layerOrder` with the new given array. Deferred until next frame for safety.

#### Example Usage

```js
this.setLayerSort(order [Array]);
```

#### Arguments

`order`: An array of strings that defines what the new `layerOrder` will be.


## Layer Properties

Every layer can have a series of properties that can vastly modify how it is used and interacted with. These properties can be defined on `.createLayer` or using `.setLayerProperties` method.

Before we get into the specific layer properties, here's a bit of explanation of the layer model:

```js
layers: {
	'backgroundMaps': {
		clearOnLoad : true,
		mapLayer    : true,
		noUpdate    : true,

		items : []
	},

	'entities': {
		clearOnLoad : true,
		entityLayer : true,

		items : []
	}
}
```

Each layer has an items array, this is automatically added on `.createLayer` and is used to hold all item instances (such as entities or background-maps). It's generally a good idea to use the `addItem` and `removeItem` methods for manipulating these arrays since they are 'safe'.

The booleans are properties that will be documented in this section.

### `mapLayer`

This defines the layer as a layer that contains background-map instances.


### `entityLayer`

This defines the layer as a layer that contains entity instances. This is very important since it will allow trigger Impact's built in collision detection to occur.

Please note, collision detection only occurs between entities on the same level.


### `clearOnLoad`

This layer's items will get cleared every time `this.loadLevel` is used.


### `noUpdate` and `noDraw`

This allows you to disable the `update` or `draw` methods of that layer's items. This can allow for some very unique features, such as pausing entity movement when you set `noUpdate` to an entities layer.


### `clean`

This means that when removing this layer, all items have a `._cleanUp` method to call on removal. This may be deprecated soon.


## Some notes on entity layers

The default entities layer will inherit a series of sorting properties from the game instance. However, every entity layer can have it's own set of sorting properties:

```
layers: {
	'entities': {
		entityLayer     : true,
		autoSort        : [Boolean - if true, all items in this layer are sorted]
		sortBy          : [Function - use any of Impact's sort algorithms or write your own]
		_doSortEntities : [Boolean - used for deferred sorting if not using autoSort]
	}
}
```

See the [ImpactJS Game Docs](http://impactjs.com/documentation/class-reference/game) for more details on these properties.

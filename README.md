# Layers

Layers is an easy to use plugin for [ImpactJS](http://impactjs.com) that replaces the built in `update` and `draw` methods for `ig.Game` with a vastly superior API for handling various layers of `items` (including `entities`, `backgroundMaps`, and `foregroundMaps`.)  If you already sold, then skip over to [Getting Started](#getting-started) now, otherwise read on for a more complete explanation.


## Why?

Now you may be asking, "Why should I even use this plugin?" A fair question, but the answer will first take a bit of an explanation.

Normally when you create an ImpactJS game you are going to require a dearth of extra functionality not immediately available.  Thankfully ImpactJS is pretty extensible and allows you easily extend any aspect of the framework to do your bidding.  While this is pretty awesome, one needs to also be careful with such power; as they say, with great power comes great responsibility.  It is easy to create overwhelming complexity in your ImpactJS application and therefore it's a good idea enforce certain patterns to keep everything sane.

One of the oft abused extensibility of ImpactJS are the `update` and `draw` methods.  These two methods alone account nearly all of execution time in an ImpactJS application.  For each frame of the application (generally executed 60 times a second) the engine first fires `update`, then `draw`.

By default, the `update` method iterates through all backgrounds, entities and foregrounds to update their states.  This is all immediately followed by `draw` which uses that state to draw the appropriate game state.

Out of the box, ImpactJS simply supports `backgroundMaps`, `entities`, and `foregroundMaps`, but what happens if you want, say a GUI that overlays on top the game? This is where the extensibility in ImpactJS starts to get hairy.  Normally the way to do this would be something like this:

```
draw: function(){
	this.parent();
	this.updateGUILayer();
}
```

This draw method would always ensure that the GUI is drawn on top of all other game elements.  Sure this is quick and dirty, and yes it works, however, what happens if we want to build a pause screen? We have to now add logic into `.updateGUILayer` to ensure it doesn't display when the game is paused. This can also apply to numerous situations, such as the level completion screen, or the opening menu, etc. All of a sudden you have this extra function call that is highly unnecessary in many contexts, and every time you build out a new part of your game that doesn't need the GUI, you have to ensure this method never gets called or returns immediately; the beginning of some good spaghetti code!

Enter Layers, the elegant way of handling all of this. As I stated earlier, Layers overwrites the based `update` and `draw` methods of `ig.Game` with a highly extendible API that allows you to draw any number of layers in any order you please.


## Getting Started

Layers creates two main variables on the game instance that you should be aware of - `.layerOrder` and `.layers`.

`.layerOrder` is an array of strings, it defines what layers are drawn and what order.

`.layers` is an object/dictionary of all the available layers.

Generally speaking the way to use Layers is to first add layers using `.createLayer` method and then set the `.layerOrder` using `.setLayerSort` method. Here's a quick example, from the including example application:

```
init: function(){
	this.createLayer('gui', {
		noUpdate: true
	});

	this.addItem({
		_layer: 'gui',
		font: this.font,
		draw: function(){
			var x = ig.system.width/2,
				y = ig.system.height/2;

			this.font.draw('Hello World!, I am a layer!', x, y, ig.Font.ALIGN.CENTER);
		}
	});
}
```

The first part of the `init` method is the `.createLayer` method. The first argument is the layer name and the second argument is an object containing level properties. In this case, I don't need an update call, only draw, so I set `noUpdate` to true to prevent an unnecessary function call. Also by default, a call to `.createLayer` adds that layer to the `.layerOrder` array.

The second part, is where we actually add an item to the `gui` layer to be drawn on the game canvas. Normally you would add an instance of something, such as an `entity` object or `background-map`, but for the sake of this explanation, we are keeping it as a simple object with the bare minimum requirements for a layer.

The first property of the item, `_layer` instructs the `.addItem` method which layer to place the item. The `font` property is simply a reference for our `draw` method.

The `draw` method is where all the action happens, normally we would have an associated `update` method as well, however, remember we set `noUpdate` to `true` so we don't need it. This `draw` method gets called on every frame of `ig.game`.

And voilà, we've created our first Layers game!


## Things to note

In order to use layers almost immediately in your application, simply add a `this.parent()` call at the start of your game's `init` function. This will ensure all the default layers get created (`backgroundMaps`, `entities`, `foregroundMaps`.)  All existing methods that deal with entities or background maps have been updated to "just work" with this new API.

One major caveat, the `this.entities` array is not used, and therefore will be empty. You can access this array via `this.layers.entities.items` instead if necessary. Again, all built in `ig.game` methods that relied upon `this.entities` (or any of the other built in background/foreground maps) will properly use the Layers API.


## API Documentation

###
